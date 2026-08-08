import { useState, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { Booking } from "../types";
import {
  sendEmail,
  createDelayNotification,
  createDelayReversalNotification,
} from "../utils/emailNotifications";

export interface ScheduleDelay {
  id: string;
  cutoffTime: string;
  delayMinutes: number;
  instrumentId: string | null;
  reason: string;
  appliedByName: string | null;
  affectedCount: number;
  status: "applied" | "reversed";
  reversedAt: string | null;
  createdAt: string;
}

export interface DelayResult {
  affected: number;
  skipped: number;
  restored?: number;
}

// Statuses that should never be moved by a delay
const IMMOVABLE_STATUSES = ["completed", "cancelled", "denied"];

const isMovable = (status: string) => !IMMOVABLE_STATUSES.includes((status || "").toLowerCase());

const mapDelay = (row: any): ScheduleDelay => ({
  id: row.id,
  cutoffTime: row.cutoff_time,
  delayMinutes: row.delay_minutes,
  instrumentId: row.instrument_id,
  reason: row.reason || "",
  appliedByName: row.applied_by_name,
  affectedCount: row.affected_count,
  status: row.status === "reversed" ? "reversed" : "applied",
  reversedAt: row.reversed_at,
  createdAt: row.created_at,
});

const getUserEmail = async (userId: string): Promise<string> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("useScheduleDelays: failed to load user email", error);
    return "";
  }
  return data?.email || "";
};

export const useScheduleDelays = () => {
  const [delays, setDelays] = useState<ScheduleDelay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const loadDelays = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("schedule_delays")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      setDelays((data || []).map(mapDelay));
    } catch (error) {
      console.error("useScheduleDelays: failed to load delays", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Push every movable booking starting at/after the cutoff forward by delayMinutes.
   * Records the event plus per-booking original times so it can be reversed exactly.
   */
  const applyDelay = useCallback(
    async (params: {
      bookings?: Booking[];
      delayMinutes: number;
      cutoff: Date;
      instrumentId?: string | null;
      reason: string;
      appliedBy?: string | null;
      appliedByName?: string | null;
    }): Promise<DelayResult> => {
      const { delayMinutes, cutoff, instrumentId, reason } = params;
      setIsWorking(true);
      try {
        const delayMs = delayMinutes * 60 * 1000;

        // Read the affected bookings straight from the database so the delay is
        // never limited by whatever subset the UI happens to have cached.
        let query = supabase
          .from("bookings")
          .select("id, user_id, instrument_id, start_time, end_time, status")
          .gte("start_time", cutoff.toISOString())
          .order("start_time", { ascending: false });
        if (instrumentId) query = query.eq("instrument_id", instrumentId);

        const { data: rows, error: rowsError } = await query;
        if (rowsError) throw rowsError;

        const targets = (rows || []).filter((b: any) => isMovable(b.status));

        if (targets.length === 0) {
          return { affected: 0, skipped: 0 };
        }

        const { data: delayRow, error: delayError } = await supabase
          .from("schedule_delays")
          .insert({
            cutoff_time: cutoff.toISOString(),
            delay_minutes: delayMinutes,
            instrument_id: instrumentId || null,
            reason,
            applied_by: params.appliedBy || null,
            applied_by_name: params.appliedByName || null,
            affected_count: 0,
            status: "applied",
          })
          .select()
          .single();
        if (delayError) throw delayError;

        const moved: Array<{ booking: any; newStart: Date; newEnd: Date }> = [];
        const failed: string[] = [];

        // Descending start order: shifting the latest booking first keeps the
        // prevent_booking_overlap trigger from seeing a transient collision.
        for (const booking of targets) {
          const newStart = new Date(new Date(booking.start_time).getTime() + delayMs);
          const newEnd = new Date(new Date(booking.end_time).getTime() + delayMs);
          const { error } = await supabase
            .from("bookings")
            .update({ start_time: newStart.toISOString(), end_time: newEnd.toISOString() })
            .eq("id", booking.id);
          if (error) {
            console.error(`Failed to delay booking ${booking.id}`, error);
            failed.push(booking.id);
            continue;
          }
          moved.push({ booking, newStart, newEnd });
        }

        if (moved.length > 0) {
          const { error: recordError } = await supabase.from("schedule_delay_bookings").insert(
            moved.map(({ booking, newStart, newEnd }) => ({
              delay_id: delayRow.id,
              booking_id: booking.id,
              original_start: new Date(booking.start_time).toISOString(),
              original_end: new Date(booking.end_time).toISOString(),
              new_start: newStart.toISOString(),
              new_end: newEnd.toISOString(),
            }))
          );
          if (recordError) {
            console.error("Failed to record delayed bookings", recordError);
          }
        }

        await supabase
          .from("schedule_delays")
          .update({ affected_count: moved.length })
          .eq("id", delayRow.id);

        // Resolve instrument names once for the notification emails.
        const instrumentIds = Array.from(
          new Set(moved.map(({ booking }) => booking.instrument_id).filter(Boolean))
        );
        const instrumentNames = new Map<string, string>();
        if (instrumentIds.length) {
          const { data: instrumentRows } = await supabase
            .from("instruments")
            .select("id, name")
            .in("id", instrumentIds);
          (instrumentRows || []).forEach((i: any) => instrumentNames.set(i.id, i.name));
        }

        // Notify affected users after all database work has settled.
        for (const { booking, newStart, newEnd } of moved) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, name")
              .eq("id", booking.user_id)
              .maybeSingle();
            if (!profile?.email) continue;
            await sendEmail(
              createDelayNotification(
                profile.email,
                profile.name || "",
                instrumentNames.get(booking.instrument_id) || "your instrument",
                delayMinutes,
                new Date(booking.start_time).toISOString(),
                newStart.toISOString(),
                newEnd.toISOString(),
                reason
              )
            );
          } catch (error) {
            console.error(`Failed to email delay notice for booking ${booking.id}`, error);
          }
        }

        await loadDelays();
        return { affected: moved.length, skipped: failed.length };
      } finally {
        setIsWorking(false);
      }
    },
    [loadDelays]
  );


  /**
   * Restore each booking moved by a delay back to its recorded original times.
   * Bookings that were deleted or rescheduled independently are skipped.
   */
  const reverseDelay = useCallback(
    async (delayId: string): Promise<DelayResult> => {
      setIsWorking(true);
      try {
        const { data: delayRow, error: delayError } = await supabase
          .from("schedule_delays")
          .select("*")
          .eq("id", delayId)
          .single();
        if (delayError) throw delayError;

        const { data: records, error: recordsError } = await supabase
          .from("schedule_delay_bookings")
          .select("*")
          .eq("delay_id", delayId);
        if (recordsError) throw recordsError;

        const bookingIds = (records || []).map((r) => r.booking_id);
        const { data: currentBookings, error: bookingsError } = bookingIds.length
          ? await supabase
              .from("bookings")
              .select("id, start_time, end_time, status, user_id, instrument_id")
              .in("id", bookingIds)
          : { data: [], error: null as any };
        if (bookingsError) throw bookingsError;

        const currentById = new Map((currentBookings || []).map((b: any) => [b.id, b]));

        // Ascending original start: restoring earlier bookings first avoids
        // transient overlaps against the not-yet-restored later ones.
        const ordered = (records || []).slice().sort(
          (a, b) => new Date(a.original_start).getTime() - new Date(b.original_start).getTime()
        );

        const restored: Array<{ record: any; current: any }> = [];
        let skipped = 0;

        for (const record of ordered) {
          const current = currentById.get(record.booking_id);
          if (!current) {
            skipped += 1;
            continue;
          }
          // Skip bookings that were rescheduled after the delay was applied.
          if (
            new Date(current.start_time).getTime() !== new Date(record.new_start).getTime() ||
            new Date(current.end_time).getTime() !== new Date(record.new_end).getTime()
          ) {
            skipped += 1;
            continue;
          }
          const { error } = await supabase
            .from("bookings")
            .update({
              start_time: new Date(record.original_start).toISOString(),
              end_time: new Date(record.original_end).toISOString(),
            })
            .eq("id", record.booking_id);
          if (error) {
            console.error(`Failed to restore booking ${record.booking_id}`, error);
            skipped += 1;
            continue;
          }
          restored.push({ record, current });
        }

        await supabase
          .from("schedule_delays")
          .update({ status: "reversed", reversed_at: new Date().toISOString() })
          .eq("id", delayId);

        // Notify restored users.
        const instrumentIds = Array.from(
          new Set(restored.map(({ current }) => current.instrument_id).filter(Boolean))
        );
        const instrumentNames = new Map<string, string>();
        if (instrumentIds.length) {
          const { data: instruments } = await supabase
            .from("instruments")
            .select("id, name")
            .in("id", instrumentIds);
          (instruments || []).forEach((i: any) => instrumentNames.set(i.id, i.name));
        }

        for (const { record, current } of restored) {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email, name")
              .eq("id", current.user_id)
              .maybeSingle();
            if (!profile?.email) continue;
            await sendEmail(
              createDelayReversalNotification(
                profile.email,
                profile.name || "",
                instrumentNames.get(current.instrument_id) || "your instrument",
                delayRow.delay_minutes,
                new Date(record.new_start).toISOString(),
                new Date(record.original_start).toISOString(),
                new Date(record.original_end).toISOString()
              )
            );
          } catch (error) {
            console.error(`Failed to email reversal notice for booking ${record.booking_id}`, error);
          }
        }

        await loadDelays();
        return { affected: restored.length, restored: restored.length, skipped };
      } finally {
        setIsWorking(false);
      }
    },
    [loadDelays]
  );

  return { delays, isLoading, isWorking, loadDelays, applyDelay, reverseDelay };
};
