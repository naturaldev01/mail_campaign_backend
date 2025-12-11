import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { parse } from 'csv-parse/sync';
import { UploadCsvDto } from './dto/upload-csv.dto';
import { SendCsvDto } from './dto/send-csv.dto';
import { FilterCsvDto } from './dto/filter-csv.dto';
import { QueueService } from '../queues/queues.service';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Parse CSV and do best-effort email detection:
   * - Headers: normalize (trim + BOM remove + lowercase), pick the first header containing "email".
   *   If not found or empty, scan row values for an email-looking string (contains "@" and basic regex).
   *   Timezone: pick header containing "timezone" when present.
   * - Headerless: scan each row cells for an email-looking value; use the next cell as timezone if present.
   */
  private parseCsvRecords(file: Express.Multer.File): Array<{ email?: string; timezone?: string; [key: string]: any }> {
    const csvText = file.buffer.toString('utf-8');
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const sanitizeHeader = (h: string) => h.replace(/^\uFEFF/, '').trim().toLowerCase();

    // Primary: expect headers, normalize them
    const withHeaders = parse(csvText, {
      columns: (header: string[]) => header.map(sanitizeHeader),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (withHeaders.length) {
      const headers = Object.keys(withHeaders[0] ?? {});
      const emailKey = headers.find((h) => h.includes('email'));
      const timezoneKey = headers.find((h) => h.includes('timezone'));

      const mapped = withHeaders.map((record): { email: string; timezone?: string; [key: string]: any } | null => {
          const values = Object.values(record);
          const fromColumn = emailKey ? record[emailKey] : undefined;
          const fromScan = values.find((v) => v && emailRegex.test(v));
          const email = (fromColumn ?? fromScan ?? '').toLowerCase().trim();
          if (!email) return null;
          const timezone = timezoneKey ? record[timezoneKey] : undefined;
          return {
            ...record,
            email,
            timezone,
          };
        });

      return mapped.filter(
        (r): r is { email: string; timezone?: string; [key: string]: any } => r !== null,
      );
    }

    // Fallback: headerless, scan each row for an email-looking cell
    const rows = parse(csvText, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
    }) as string[][];

    const mapped: Array<{ email: string; timezone?: string }> = [];
    for (const row of rows) {
      if (!row?.length) continue;
      const emailCell = row.find((cell) => cell && emailRegex.test(cell));
      if (!emailCell) continue;
      const timezone = row.length > 1 ? row[1] : undefined;
      mapped.push({ email: emailCell.toLowerCase().trim(), timezone });
    }

    return mapped;
  }

  async filterCsv(file: Express.Multer.File, dto: FilterCsvDto) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    if (!dto.filterField) {
      throw new BadRequestException('filterField is required');
    }
    if (dto.operator === 'in' && (!dto.values || !dto.values.length)) {
      throw new BadRequestException('values is required for "in" operator');
    }
    if (dto.operator !== 'in' && !dto.value) {
      throw new BadRequestException('value is required for the selected operator');
    }

    const supabaseClient = this.supabase.getClient();
    console.log('[filterCsv] start', {
      filename: file.originalname,
      size: file.size,
      filterField: dto.filterField,
      operator: dto.operator,
      value: dto.value,
      values: dto.values,
    });

    const records = this.parseCsvRecords(file);
    console.log('[filterCsv] parsed records', { total: records.length });

    const filterField = dto.filterField.toLowerCase().trim();
    const valuesSet =
      dto.operator === 'in' && dto.values
        ? new Set(dto.values.map((v) => (v ?? '').toString().toLowerCase().trim()))
        : undefined;
    const normValue = dto.value?.toString().toLowerCase().trim();

    const filtered = records.filter((r) => {
      const attributes = r as Record<string, any>;
      const raw = attributes[filterField] ?? attributes.attributes?.[filterField];
      if (raw === undefined || raw === null) return false;
      const val = raw.toString().toLowerCase().trim();
      if (dto.operator === 'equals') return val === normValue;
      if (dto.operator === 'contains') return normValue ? val.includes(normValue) : false;
      if (dto.operator === 'in') return valuesSet ? valuesSet.has(val) : false;
      return false;
    });

    console.log('[filterCsv] filtered', { total: filtered.length });
    if (!filtered.length) {
      throw new BadRequestException('No rows matched filter');
    }

    // Create audience for the filtered set
    const audienceName =
      dto.audienceName ??
      `Filtered ${filterField} ${dto.operator} ${dto.operator === 'in' ? dto.values?.join(',') : dto.value}`;
    const { data: audience, error: audienceError } = await supabaseClient
      .from('audiences')
      .insert({
        name: audienceName,
        description: 'Filtered audience from CSV',
        type: 'static',
      })
      .select()
      .single();

    if (audienceError || !audience) {
      this.logger.error('Failed to create filtered audience', audienceError);
      throw new BadRequestException('Could not create filtered audience');
    }

    const contactsPayload: any[] = [];
    const seen = new Set<string>();
    for (const record of filtered) {
      const email = (record.email ?? '').toLowerCase();
      const timezone = record.timezone ?? dto.timezoneFallback ?? 'UTC';
      if (!email) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      const attributes = { ...record, timezone };
      delete (attributes as any).email;
      delete (attributes as any).timezone;
      contactsPayload.push({
        audience_id: audience.id,
        email,
        attributes,
        status: 'active',
      });
    }

    if (!contactsPayload.length) {
      throw new BadRequestException('No valid emails after filtering');
    }
    console.log('[filterCsv] contacts prepared', { total: contactsPayload.length });

    const { error: contactError } = await supabaseClient.from('contacts').upsert(contactsPayload, {
      onConflict: 'audience_id,email',
    });
    if (contactError) {
      this.logger.error('Failed to upsert filtered contacts', contactError);
      throw new BadRequestException('Could not upsert filtered contacts');
    }

    return {
      audienceId: audience.id,
      filteredRows: contactsPayload.length,
    };
  }

  async uploadCsv(file: Express.Multer.File, dto: UploadCsvDto) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    const supabaseClient = this.supabase.getClient();
    console.log('[uploadCsv] start', {
      filename: file.originalname,
      size: file.size,
    });

    // persist file to storage for traceability
    const storagePath = `uploads/${Date.now()}-${file.originalname}`;
    const { error: storageError } = await supabaseClient.storage
      .from('uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype ?? 'text/csv',
        upsert: false,
      });
    if (storageError) {
      this.logger.warn('Failed to persist CSV to storage', storageError);
    }

    const records = this.parseCsvRecords(file);
    console.log('[uploadCsv] parsed records', {
      total: records.length,
    });

    const { data: batch, error: batchError } = await supabaseClient
      .from('upload_batches')
      .insert({
        filename: file.originalname,
        total_rows: records.length,
        status: 'processing',
      })
      .select()
      .single();

    if (batchError || !batch) {
      this.logger.error('Failed to create upload batch', batchError);
      throw new BadRequestException('Could not create upload batch');
    }

    const validContacts: any[] = [];
    const stagedValid: any[] = [];
    const stagedInvalid: any[] = [];
    const seen = new Set<string>();

    for (const record of records) {
      const email = (record.email ?? '').toLowerCase();
      const timezone = record.timezone ?? dto.timezoneFallback;
      if (!email || !timezone) {
        stagedInvalid.push({
          batch_id: batch.id,
          email,
          attributes: record,
          error: 'Missing email or timezone',
        });
        continue;
      }
      if (seen.has(email)) {
        stagedInvalid.push({
          batch_id: batch.id,
          email,
          attributes: record,
          error: 'Duplicate email in batch',
        });
        continue;
      }
      seen.add(email);

      const attributes = { ...record, timezone };
      delete (attributes as any).email;
      delete (attributes as any).timezone;

      stagedValid.push({
        batch_id: batch.id,
        email,
        attributes,
      });

      if (dto.audienceId) {
        validContacts.push({
          audience_id: dto.audienceId,
          email,
          attributes,
          status: 'active',
        });
      }
    }

    if (stagedValid.length) {
      await supabaseClient.from('staged_contacts').insert(stagedValid);
    }
    if (stagedInvalid.length) {
      await supabaseClient.from('staged_contacts').insert(stagedInvalid);
    }
    if (validContacts.length) {
      await supabaseClient
        .from('contacts')
        .upsert(validContacts, { onConflict: 'audience_id,email' });
    }

    await supabaseClient
      .from('upload_batches')
      .update({
        status: 'completed',
        valid_rows: stagedValid.length,
        invalid_rows: stagedInvalid.length,
      })
      .eq('id', batch.id);

    return {
      batchId: batch.id,
      totalRows: records.length,
      validRows: stagedValid.length,
      invalidRows: stagedInvalid.length,
      storagePath: storageError ? null : storagePath,
    };
  }

  async sendCsv(file: Express.Multer.File, dto: SendCsvDto) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    if (!dto.subject) {
      throw new BadRequestException('Subject is required');
    }

    const supabaseClient = this.supabase.getClient();
    console.log('[sendCsv] start', {
      filename: file.originalname,
      size: file.size,
      subject: dto.subject,
    });

    // persist file to storage
    const storagePath = `uploads/${Date.now()}-${file.originalname}`;
    const { error: storageError } = await supabaseClient.storage
      .from('uploads')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype ?? 'text/csv',
        upsert: false,
      });
    if (storageError) {
      this.logger.warn('Failed to persist CSV to storage', storageError);
    }

    const records = this.parseCsvRecords(file);
    console.log('[sendCsv] parsed records', { total: records.length });

    // Create an ad-hoc audience to hold these contacts (kept internal)
    const audienceName = dto.campaignName ?? `CSV Upload ${new Date().toISOString()}`;
    const { data: audience, error: audienceError } = await supabaseClient
      .from('audiences')
      .insert({
        name: audienceName,
        description: 'Ad-hoc audience for CSV send',
        type: 'static',
      })
      .select()
      .single();

    if (audienceError || !audience) {
      this.logger.error('Failed to create ad-hoc audience', audienceError);
      throw new BadRequestException('Could not create audience for CSV send');
    }

    // Prepare contacts
    const contactsPayload: any[] = [];
    const seen = new Set<string>();
    for (const record of records) {
      const email = (record.email ?? '').toLowerCase();
      const timezone = record.timezone ?? dto.timezoneFallback ?? 'UTC';
      if (!email) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      const attributes = { ...record, timezone };
      delete (attributes as any).email;
      delete (attributes as any).timezone;
      contactsPayload.push({
        audience_id: audience.id,
        email,
        attributes,
        status: 'active',
      });
    }

    if (!contactsPayload.length) {
      throw new BadRequestException('No valid emails found in CSV');
    }
    console.log('[sendCsv] contacts prepared', { total: contactsPayload.length });

    const { data: contacts, error: contactError } = await supabaseClient
      .from('contacts')
      .upsert(contactsPayload, { onConflict: 'audience_id,email' })
      .select();

    if (contactError) {
      this.logger.error('Failed to upsert contacts from CSV', contactError);
      throw new BadRequestException('Could not upsert contacts from CSV');
    }

    // Create a one-off campaign
    const { data: campaign, error: campaignError } = await supabaseClient
      .from('campaigns')
      .insert({
        name: dto.campaignName ?? `CSV Campaign ${new Date().toISOString()}`,
        template_id: null,
        status: 'sending',
        scheduled_at: null,
        from_name: dto.fromName,
        from_email: dto.fromEmail,
        reply_to: dto.replyTo,
        subject_override: dto.subject,
        send_options: { timezone: dto.timezoneFallback ?? 'UTC' },
      })
      .select()
      .single();

    if (campaignError || !campaign) {
      this.logger.error('Failed to create campaign for CSV send', campaignError);
      throw new BadRequestException('Could not create campaign for CSV send');
    }

    // Link campaign to audience
    await supabaseClient.from('campaign_audiences').insert({
      campaign_id: campaign.id,
      audience_id: audience.id,
    });
    console.log('[sendCsv] linked campaign to audience', { campaignId: campaign.id, audienceId: audience.id });

    // Create messages and enqueue
    for (const contact of contacts ?? []) {
      const { data: message, error: messageError } = await supabaseClient
        .from('messages')
        .upsert(
          {
            campaign_id: campaign.id,
            contact_id: contact.id,
            status: 'queued',
          },
          { onConflict: 'campaign_id,contact_id' },
        )
        .select()
        .single();

      if (messageError || !message) {
        this.logger.error('Failed to create message record', messageError);
        continue;
      }

      await this.queueService.enqueueMail({
        messageId: message.id,
        campaignId: campaign.id,
        contactId: contact.id,
        email: contact.email,
        subject: dto.subject,
        bodyHtml: dto.bodyHtml ?? undefined,
        bodyText: dto.bodyText ?? undefined,
        variables: contact.attributes ?? {},
        sendAfter: new Date(),
        replyTo: dto.replyTo,
      });
    }

    return {
      campaignId: campaign.id,
      audienceId: audience.id,
      queued: contacts?.length ?? 0,
      storagePath: storageError ? null : storagePath,
    };
  }
}

