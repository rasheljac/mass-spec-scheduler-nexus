# Fix dialog overflow & file row truncation

## Problem
The Edit Booking dialog still overflows horizontally — the long sequence filename (`Javier-Final-DataTable_M9_MathSound_IonCounts.xlsx`) pushes the Edit / Replace / Remove buttons off the right edge of the popup, even with `max-w-lg`.

## Root causes
1. **Dialog too narrow** — `sm:max-w-lg` (32rem ≈ 512px) is too small for a form that contains a file row plus action buttons.
2. **Filename row doesn't truncate reliably** — the file card uses `flex-1 min-w-0`, but in some flex contexts the truncation still fails because the inner `<div className="truncate">` needs an explicit `min-w-0` chain or `block` width constraint.

## Changes

### 1. `src/components/calendar/EditBookingForm.tsx`
Widen the dialog so the form has more breathing room:
- Change `sm:max-w-lg` → `sm:max-w-2xl` (672px) on the `DialogContent`.

### 2. `src/components/calendar/BookingForm.tsx`
Apply the same width for visual consistency:
- Change `sm:max-w-lg` → `sm:max-w-2xl` on the `DialogContent`.

### 3. `src/components/calendar/SequenceFileUpload.tsx`
Make the file row bulletproof against long filenames:
- Add `min-w-0` to the outer file-row container (both existing and pending variants) so flex children can shrink below content width.
- Add `block w-full` (or keep `truncate` on the parent and remove from child) to ensure the filename ellipsizes instead of expanding the row.
- Keep action buttons (`Download`, `Edit`, `Replace`, `Remove`) as `shrink-0` so they always stay visible on the right.

## Result
The dialog becomes wider and more comfortable on desktop, and even very long sequence filenames will truncate with an ellipsis — keeping every action button inside the popup with no sideways scrolling.
