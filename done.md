# Yapılanlar Özeti (Mail Campaign Backend)

- Supabase şeması (`supabase/migrations/001_init.sql`):
  - Tablolar: `profiles`, `audiences`, `contacts`, `templates`, `campaigns` (send_options jsonb), `campaign_audiences`, `messages`, `email_events`, `upload_batches`, `staged_contacts`.
  - Uzantılar: `uuid-ossp`, `citext`. Indexler ve temel RLS politikaları eklendi.
- Ortak yapı:
  - `env.example`: Supabase, Mailgun, Redis, port değişkenleri.
  - `AppModule`: Config + tüm feature modülleri yükleniyor, global ValidationPipe (`main.ts`).
  - `SupabaseModule/SupabaseService`: service-role anahtarıyla Supabase client sağlar.
  - `QueuesModule/QueueService`: BullMQ + Redis kurulum; `enqueueMail` gecikmeli job destekler. Queue adı `MAIL_QUEUE`.
- Upload (CSV) akışı:
  - `UploadsController` `POST /uploads/csv` (Multer file).
  - `UploadsService.uploadCsv(file, dto)`: CSV parse → `upload_batches` kaydı → geçerli satırları `staged_contacts` ve `contacts` (audience bağlı) içine yazar, hatalıları `staged_contacts`’a error mesajıyla ekler, batch durumunu günceller.
- Audience & Contact:
  - `AudiencesController` `POST /audiences`, `GET /audiences`, `POST /audiences/:id/contacts`, `GET /audiences/:id/contacts`.
  - `AudiencesService`: audience oluşturma/listeme, contact upsert (audience + email unique), timezone bilgisi attributes’a eklenir.
- Template:
  - `TemplatesController` `POST /templates`, `GET /templates`.
  - `TemplatesService`: subject/body_html/body_text alanlı template CRUD (insert + list).
- Campaign:
  - `CampaignsController` `POST /campaigns`, `GET /campaigns`, `PATCH /campaigns/:id/status/:status`.
  - `CampaignsService`: campaign insert (scheduled ise status=scheduled), send_options jsonb saklanır, audience link kayıtları (`campaign_audiences`) eklenir, status güncelleyebilir.
- Scheduler:
  - `SchedulerService` (`@Cron EVERY_MINUTE`): status=scheduled ve zamanı gelmiş kampanyaları bulur, ilgili audience’ların contact’larını çeker, her contact için `messages` upsert eder ve kuyruğa mail job’u yazar.
  - Template subject/body kampanyaya bağlı olarak yüklenir; subject_override varsa onu kullanır.
- Delivery (Mailgun):
  - `MailgunService`: Mailgun API (messages endpoint) ile gönderim; from/reply-to/variables destekler.
  - `MailProcessor` (WorkerHost, `@Processor(MAIL_QUEUE)`): job alır → message status=sent/failed günceller, provider_message_id saklar, hata olursa last_error yazar.
- Webhook:
  - `MailgunWebhookController` `POST /webhooks/mailgun`: signature doğrular; event (delivery/open/click/bounce/complaint/unsub) geldiğinde `email_events` ekler, bounce/complaint ise `messages.status` günceller. provider_message_id üzerinden `messages` eşleştirir.
- Raporlama:
  - `ReportsController` `GET /reports/campaigns/:id`
  - `ReportsService.campaignStats`: campaign mesaj durumları (queued/sent/failed…) ve event sayımları (opened/clicked/bounced vb.) döner.
- Derleme/test:
  - `npm run build` başarıyla çalışır (TS hatası yok).

Genel akış:
1) CSV yükle → staging + contacts → audience hazır.
2) Template ve campaign oluştur; audience’ları bağla, gerekirse scheduled_at ve send_options ayarla.
3) Cron scheduler due kampanyaları işleyip mesajları kuyruğa yazar.
4) Worker Mailgun’a gönderir, durumları günceller.
5) Mailgun webhook event’leri işler; rapor uç noktası istatistik döner.

