## Goal

Let users optionally attach an LCMS Excel sequence file to a booking. Files are stored on **your own S3-compatible server** (MinIO, Ceph, Wasabi, Backblaze B2, etc.) — not AWS S3. Admins configure the endpoint, bucket, and credentials in a new admin panel, and can toggle the upload feature on/off.

## Architecture

Since we're not using AWS, we can't use the Lovable AWS S3 connector. Instead:

- **Credentials live in Supabase secrets** (not in the database) — `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. These are set once via the admin panel, which calls a small "save secrets" edge function that writes them via Supabase's secret API. Service-role key never touches the browser.
- **Non-secret settings live in a DB `app_settings` table**: `s3_uploads_enabled`, `s3_path_prefix`, `s3_endpoint_display` (just for showing "connected to xyz" in the admin UI), `s3_bucket_display`.
- **Edge functions handle all S3 traffic** using AWS SigV4 signing (S3-compatible servers all speak SigV4). We'll either use the official `aws4fetch` library (tiny, Deno-friendly) or a hand-rolled signer. Files stream through the edge function — the browser never talks to S3 directly, so no bucket-CORS configuration is needed on your S3 server.

### Why proxy uploads through edge functions instead of presigned URLs
- Self-hosted S3 servers usually aren't internet-reachable from the user's browser, or sit behind auth/VPN. Proxying avoids that.
- No need to configure CORS on the S3 server.
- Keeps credentials fully server-side.
- Trade-off: file passes through the edge function (Supabase edge function body limit is ~10 MB on the free tier, ~256 MB on paid). I'll cap uploads at **25 MB** which is plenty for `.xlsx` sequence files. If you need bigger, we can switch to presigned URLs later.

## Database changes (one migration)

**New table `app_settings`** (singleton row, id = fixed uuid):
- `id` uuid pk
- `s3_uploads_enabled` boolean default false
- `s3_path_prefix` text default `'lcms-sequences/'`
- `s3_endpoint_display` text — e.g. `https://s3.mylab.example.com` (shown in admin UI)
- `s3_bucket_display` text
- `updated_at` timestamptz default now()
- RLS:
  - SELECT for authenticated users (forms need to know if uploads are enabled).
  - UPDATE/INSERT only via `is_admin(auth.uid())`.

**Add columns to `bookings`**:
- `sequence_file_key` text nullable
- `sequence_file_name` text nullable
- `sequence_file_size` integer nullable
- `sequence_file_uploaded_at` timestamptz nullable

No new RLS — inherits existing booking visibility (everyone can see, owner + admin can edit).

## Secrets to create

Via the `add_secret` tool after the user approves:
- `S3_ENDPOINT` — e.g. `https://s3.mylab.example.com`
- `S3_REGION` — e.g. `us-east-1` (most self-hosted servers accept any region string)
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE` — `'true'` for MinIO/Ceph, `'false'` for hosts that support virtual-host-style

These will be requested through the standard Lovable secret prompt — you paste them in once, they're stored encrypted, and only edge functions can read them via `Deno.env.get(...)`.

## Edge functions

All four use CORS headers, validate the user's JWT, and use Zod for input validation.

1. **`s3-upload-sequence`** (POST, multipart/form-data)
   - Body: `file` (binary), `bookingId` (uuid)
   - Validates: extension in `.xlsx/.xls/.csv`, size ≤ 25 MB, user owns the booking or is admin, uploads enabled in `app_settings`.
   - Computes key: `${s3_path_prefix}${bookingId}/${timestamp}-${safeName}`.
   - Signs and sends a `PUT ${S3_ENDPOINT}/${bucket}/${key}` (or path-style) with SigV4.
   - Updates the booking row with `sequence_file_*` fields.
   - Returns `{ key, name, size }`.

2. **`s3-download-sequence`** (GET)
   - Query: `bookingId`
   - Validates JWT (any authenticated user — matches existing booking visibility).
   - Looks up the booking, gets `sequence_file_key`.
   - Streams the file back from S3 with proper `Content-Disposition: attachment; filename="..."`.

3. **`s3-delete-sequence`** (POST)
   - Body: `bookingId`
   - Owner or admin only. Deletes the S3 object and clears the booking columns.

4. **`s3-test-connection`** (POST, admin only)
   - Performs a `HEAD` on the bucket (or lists 1 object) to verify credentials, endpoint, and path-style flag.
   - Returns `{ ok: true }` or a clear error message — surfaced in the admin UI.

(No separate "save secrets" function — secrets are added through the standard Lovable secret prompt, which I'll trigger after you approve the plan. The admin UI just displays which secrets are set and lets you re-test.)

### SigV4 signing
I'll use the lightweight [`aws4fetch`](https://github.com/mhart/aws4fetch) ESM package via Deno's `npm:` specifier. It's ~5 KB, has no native deps, and works with any S3-compatible endpoint. No AWS SDK needed.

## Frontend changes

### Admin: new "Storage" tab in `AdminPage.tsx`
New component `S3SettingsManagement.tsx`:
- Status panel: shows whether each required secret is set (✓/✗), the configured endpoint and bucket from `app_settings`.
- "Test connection" button → calls `s3-test-connection`, shows green/red banner.
- Toggle: **Enable sequence file uploads on bookings**.
- Inputs: path prefix, endpoint display, bucket display.
- Inline help text explaining how to add/update secrets via the Lovable secret prompt (we cannot fully automate updating them later, but we can re-prompt).
- Save button → updates `app_settings`.

### Booking forms: `BookingForm.tsx` and `EditBookingForm.tsx`
- New hook `useAppSettings()` reads the singleton `app_settings` row (cached, refreshed on focus).
- If `s3_uploads_enabled === true`, render an "Upload sequence file (optional)" section.
- New shared component `SequenceFileUpload.tsx`:
  - `<Input type="file" accept=".xlsx,.xls,.csv">`.
  - Size check (≤ 25 MB) with friendly error.
  - On submit of the booking, upload happens *after* the booking row exists so we have a `bookingId`. Flow: create booking → if file selected, POST it to `s3-upload-sequence` → show toast on completion. One combined loading state on the submit button.
  - In edit mode: shows existing file with name, size, download link, and "Replace" / "Remove" buttons.

### Booking display
- `BookingCard.tsx` and the calendar tooltip: if `sequence_file_key` is set, show a small "📎 Download sequence" link → opens `${SUPABASE_URL}/functions/v1/s3-download-sequence?bookingId=...` in a new tab (with auth header — handled by a tiny helper that fetches the file as a blob and triggers a download).

## Files to create

- `supabase/migrations/<timestamp>_app_settings_and_booking_files.sql`
- `supabase/functions/s3-upload-sequence/index.ts`
- `supabase/functions/s3-download-sequence/index.ts`
- `supabase/functions/s3-delete-sequence/index.ts`
- `supabase/functions/s3-test-connection/index.ts`
- `supabase/functions/_shared/s3Client.ts` — shared SigV4 helper using `aws4fetch`
- `src/components/admin/S3SettingsManagement.tsx`
- `src/hooks/useAppSettings.ts`
- `src/components/calendar/SequenceFileUpload.tsx`
- `src/components/calendar/SequenceFileLink.tsx`

## Files to edit

- `src/pages/AdminPage.tsx` — add "Storage" tab (grid → 9 cols).
- `src/components/calendar/BookingForm.tsx` — integrate `SequenceFileUpload`.
- `src/components/calendar/EditBookingForm.tsx` — integrate `SequenceFileUpload` + `SequenceFileLink`.
- `src/types/index.ts` — add 4 optional fields to `Booking`.
- `src/contexts/OptimizedBookingContext.tsx` and/or `src/hooks/useBookings.ts` — map the new DB columns.
- `src/components/bookings/BookingCard.tsx` — show download link.

## Setup steps after approval

1. I run the DB migration (one approval prompt).
2. I trigger the Lovable secret prompt for the 6 S3 secrets — you paste them once.
3. I deploy the edge functions automatically.
4. You open **Admin → Storage**, click **Test connection**, then toggle **Enable uploads** and save.
5. The upload field appears for everyone on the booking forms.

## Open questions

1. **Allowed file types** — I assumed `.xlsx`, `.xls`, `.csv`. Add anything else (e.g. `.sld`, `.m`, `.txt`)?
2. **Max file size** — 25 MB OK, or do you need larger (would require switching to presigned PUT, which means your S3 server must be browser-reachable and have CORS)?
3. **Who can upload** — only the booking owner + admins (my assumption), or any authenticated user?
4. **Who can download** — same as booking visibility (any authenticated user), or restrict to owner + admins?
5. **Path-style vs virtual-host** — MinIO/Ceph need path-style; Wasabi/Backblaze accept either. I'll expose this as the `S3_FORCE_PATH_STYLE` secret so you can flip it without code changes. Confirm which server you're using if you already know.
