## In-browser sequence file editor

Add a modal "Edit in browser" experience for the LCMS sequence file attached to a booking. Users can open the .xlsx / .xls / .csv file in a spreadsheet grid, edit cells live, and save changes back to your S3 server — overwriting the existing object.

### Library choice

Use **Univer Sheets** (`@univerjs/presets`) — an open-source, Apache-2.0 licensed Excel-like editor with:
- Familiar Excel UI (toolbar, formula bar, multiple sheets, formulas, formatting, merged cells)
- First-class `.xlsx` import/export (preserves formulas, styles, multiple sheets)
- CSV import/export
- Runs entirely in the browser (no server-side conversion)
- React-friendly mounting API

This is a much better fit than lighter grids (Handsontable is non-free for commercial; SheetJS alone has no UI; Luckysheet is unmaintained). Univer is the modern successor to Luckysheet from the same team.

### User experience

1. On a booking with an attached sequence file, an **"Edit"** button appears next to the existing Download button (in `SequenceFileUpload` and `SequenceFileLink`).
2. Clicking it opens a full-screen Dialog containing the Univer spreadsheet, pre-loaded with the file from S3.
3. A header strip shows the file name, a "Saving…" indicator, and **Save** / **Save & Close** / **Cancel** buttons.
4. On save, the workbook is exported back to the original format (`.xlsx` stays `.xlsx`, `.csv` stays `.csv`) and uploaded to S3 — overwriting the same object key so download links keep working.
5. Toast confirms success; the booking's `sequence_file_size` and `sequence_file_uploaded_at` get refreshed.

### Permissions

- The editor is available to: the booking owner, and admins. (Same rule the existing upload/delete edge functions already enforce server-side.)
- Other users still see the read-only Download button as today.

### Technical changes

**New dependency**
- `@univerjs/presets` (bundles Univer core + Sheets + UI + xlsx import/export plugin)

**New edge function: `s3-replace-sequence`**
- POST multipart: `bookingId`, `file` (the edited blob)
- Validates: auth, user owns booking or is admin, S3 enabled, same allowed extensions, size ≤ 25 MB
- Looks up the existing `sequence_file_key` for the booking and overwrites that exact object (preserves the key so existing references stay valid)
- Updates `sequence_file_size` and `sequence_file_uploaded_at` (keeps `sequence_file_name` and `sequence_file_key` unchanged)
- Same SigV4 signing pattern as the existing `s3-upload-sequence` function
- Returns updated metadata

**New component: `src/components/calendar/SequenceFileEditor.tsx`**
- Full-screen `Dialog` from shadcn
- Lazy-loads Univer (dynamic `import()`) so the editor bundle only ships when actually opened
- On open: fetches the file via the existing `s3-download-sequence` function, parses with Univer's xlsx import (or treats CSV as a single-sheet import)
- Mounts the Univer instance into a container ref
- On Save: exports via Univer's xlsx export → Blob → POST to `s3-replace-sequence`
- Properly disposes the Univer instance on close to avoid memory leaks

**Updates to existing components**
- `SequenceFileUpload.tsx`: add an "Edit" button (pencil icon) next to Download when `existingFileName` is present and the user is owner/admin; clicking opens the editor modal
- `SequenceFileLink.tsx`: same edit button on booking cards (gated by ownership/admin)
- `OptimizedBookingContext.tsx`: expose a `refreshBooking(id)` helper (or reuse existing refresh) so the UI updates after a save

**Bundle size note**
Univer is ~1–2 MB gzipped. To avoid bloating the initial app bundle, the editor component uses dynamic imports so the library only loads when a user actually clicks "Edit".

### Out of scope
- Real-time collaborative editing across multiple users (Univer supports it, but it requires a sync server — out of scope here).
- Conflict resolution if two people edit simultaneously — last save wins. We can add basic optimistic locking later if needed.
- Editing files >25 MB (same limit as upload).

### Files touched
- New: `supabase/functions/s3-replace-sequence/index.ts`
- New: `src/components/calendar/SequenceFileEditor.tsx`
- Edited: `src/components/calendar/SequenceFileUpload.tsx`, `src/components/calendar/SequenceFileLink.tsx`
- Edited: `src/contexts/OptimizedBookingContext.tsx` (refresh helper if not already present)
- Edited: `package.json` (add `@univerjs/presets`)
