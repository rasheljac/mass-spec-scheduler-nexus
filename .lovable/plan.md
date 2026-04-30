## Calendar Booking Visibility & Overlap Prevention

### Goal
1. Make every booking visible as a full time block on the shared calendar so all users can see when an instrument is in use
2. Prevent users from creating a new booking that overlaps with an existing booking on the same instrument

### Part 1: Full Block Visibility on Calendar

**Current state:** The calendar already loads all bookings, but blocks may not always render as the full duration of the booking, and other users' booking details may be limited.

**What I'll do:**
- Ensure every booking renders as a continuous block spanning its full `start_time` to `end_time` on the calendar (week and day views)
- Show the instrument name, booking owner's name, and time range on every block so all users can see who has the instrument reserved and when
- Keep sensitive fields (purpose, experimental details) hidden from non-owners — only the owner and admins see those when clicking into a booking
- Use a visual distinction (e.g., slightly muted styling) for bookings owned by other users so the current user can quickly spot their own bookings

### Part 2: Overlap Prevention

**Two layers of protection** (frontend + backend) so it works even if someone bypasses the UI:

**Frontend check (immediate user feedback):**
- In the BookingForm and EditBookingForm, before submitting, query existing bookings for the selected instrument that overlap the requested time window
- Overlap rule: a new booking `[newStart, newEnd)` conflicts with an existing booking `[existStart, existEnd)` on the same instrument if `newStart < existEnd AND newEnd > existStart`
- Exclude cancelled/denied bookings from the conflict check (those time slots are free again)
- When editing, exclude the booking being edited from its own conflict check
- If a conflict is found, show a clear error message naming the conflicting time range and block submission

**Backend check (authoritative protection):**
- Add a database trigger on the `bookings` table that runs before INSERT and UPDATE
- The trigger checks for any other booking on the same `instrument_id` with overlapping time and a non-cancelled status
- If a conflict exists, the trigger raises an exception, preventing the row from being saved
- This guarantees no overlapping bookings can exist even if a request bypasses the frontend (direct API call, race condition between two simultaneous bookings, etc.)

### Part 3: UX Polish
- When a user clicks an empty time slot to create a booking, pre-check that the slot is free before opening the form
- Show available vs. taken time slots more clearly in the day view
- Add a helpful tooltip on existing blocks showing "Booked by [Name] — [Start] to [End]"

### Files to Modify
- `src/components/calendar/CalendarView.tsx` — full-block rendering and tooltips
- `src/components/calendar/BookingForm.tsx` — frontend overlap check on create
- `src/components/calendar/EditBookingForm.tsx` — frontend overlap check on update (excluding self)
- `src/contexts/OptimizedBookingContext.tsx` — small helper for overlap detection
- New database migration — trigger + function for backend overlap prevention

### What This Does NOT Change
- Users can still see all bookings on the calendar (your core requirement is preserved)
- Calendar functionality remains identical for normal use
- This is independent of the security fixes we'll tackle next — no conflicts there

### Edge Cases Handled
- Back-to-back bookings (one ends exactly when another starts) are allowed — not considered an overlap
- Cancelled/denied bookings don't block new bookings in their old time slot
- Editing a booking won't conflict with itself
- Admins can still override and manage all bookings as before

Let me know if you want any changes (e.g., should admins be allowed to create overlapping bookings? Should "delayed" status block the slot or free it?), otherwise I'll proceed with implementation.