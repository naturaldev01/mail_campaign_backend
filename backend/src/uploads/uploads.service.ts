import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { parse } from 'csv-parse/sync';
import { UploadCsvDto } from './dto/upload-csv.dto';
import { SendCsvDto } from './dto/send-csv.dto';
import { QueueService } from '../queues/queues.service';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly queueService: QueueService,
  ) {}

  async uploadCsv(file: Express.Multer.File, dto: UploadCsvDto) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    const supabaseClient = this.supabase.getClient();

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

    const csvText = file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

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

    const csvText = file.buffer.toString('utf-8');
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

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

