
import { useState, useCallback, useRef, useEffect } from "react";
import { Booking, Comment, User } from "../types";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export const useOptimizedBookings = (users: User[]) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<{ data: Booking[], timestamp: number } | null>(null);
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Helper function to get user data efficiently
  const getUserData = useCallback((userId: string) => {
    const user = users.find(u => u.id === userId);
    return {
      email: user?.email || "",
      name: user?.name || "Unknown User"
    };
  }, [users]);

  // Optimized load function with caching and efficient queries
  const loadBookings = useCallback(async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && cacheRef.current) {
      const { data, timestamp } = cacheRef.current;
      if (Date.now() - timestamp < CACHE_TTL) {
        setBookings(data);
        return;
      }
    }

    setIsLoading(true);
    try {
      console.log("Loading bookings with optimized queries");
      
      // Single query with joins for better performance
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
          *,
          instruments!inner(name),
          profiles!inner(name)
        `);

      if (error) throw error;

      if (bookingsData) {
        // Get all comments in a single query
        const bookingIds = bookingsData.map(b => b.id);
        const { data: commentsData } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!inner(name)
          `)
          .in('booking_id', bookingIds);

        // Group comments by booking ID
        const commentsByBooking = new Map<string, Comment[]>();
        commentsData?.forEach(comment => {
          const bookingComments = commentsByBooking.get(comment.booking_id) || [];
          bookingComments.push({
            id: comment.id,
            userId: comment.user_id,
            userName: comment.profiles.name,
            content: comment.content,
            createdAt: new Date(comment.created_at).toISOString()
          });
          commentsByBooking.set(comment.booking_id, bookingComments);
        });

        // Transform data efficiently
        const formattedBookings: Booking[] = bookingsData.map(booking => ({
          id: booking.id,
          userId: booking.user_id,
          userName: booking.profiles.name,
          instrumentId: booking.instrument_id,
          instrumentName: booking.instruments.name,
          start: new Date(booking.start_time).toISOString(),
          end: new Date(booking.end_time).toISOString(),
          purpose: booking.purpose,
          status: booking.status,
          createdAt: new Date(booking.created_at).toISOString(),
          details: booking.details || "",
          comments: commentsByBooking.get(booking.id) || []
        }));

        // Update cache
        cacheRef.current = {
          data: formattedBookings,
          timestamp: Date.now()
        };

        setBookings(formattedBookings);
        console.log(`Loaded ${formattedBookings.length} bookings efficiently`);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  }, [users]);

  // Optimized create function
  const createBooking = useCallback(async (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => {
    try {
      console.log("Creating booking:", bookingData);
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: bookingData.userId,
          instrument_id: bookingData.instrumentId,
          start_time: bookingData.start,
          end_time: bookingData.end,
          purpose: bookingData.purpose,
          status: bookingData.status,
          details: bookingData.details || null
        })
        .select();

      if (error) throw new Error(`Database error: ${error.message}`);
      
      if (data && data[0]) {
        // Invalidate cache and reload
        cacheRef.current = null;
        await loadBookings(true);
        
        // Send email notification (simplified, single attempt)
        const { email: userEmail } = getUserData(bookingData.userId);
        if (userEmail) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: userEmail,
                subject: `Booking Confirmation: ${bookingData.instrumentName}`,
                templateType: 'booking_confirmation',
                variables: {
                  userName: bookingData.userName || "User",
                  instrumentName: bookingData.instrumentName || "Instrument",
                  startDate: new Date(bookingData.start).toLocaleString(),
                  endDate: new Date(bookingData.end).toLocaleString(),
                  status: bookingData.status || "pending",
                  purpose: bookingData.purpose || ""
                }
              }
            });
            toast.success("Booking created and confirmation email sent");
          } catch {
            toast.success("Booking created (email notification failed)");
          }
        } else {
          toast.success("Booking created successfully");
        }
        
        return data[0];
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create booking";
      toast.error(errorMessage);
      throw error;
    }
  }, [loadBookings, getUserData]);

  // Optimized update function
  const updateBooking = useCallback(async (bookingData: Booking) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          user_id: bookingData.userId,
          instrument_id: bookingData.instrumentId,
          start_time: bookingData.start,
          end_time: bookingData.end,
          purpose: bookingData.purpose,
          status: bookingData.status,
          details: bookingData.details || null
        })
        .eq('id', bookingData.id);

      if (error) throw error;

      // Invalidate cache and reload
      cacheRef.current = null;
      await loadBookings(true);
      
      toast.success("Booking updated successfully");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
      throw error;
    }
  }, [loadBookings]);

  // Optimized delete function
  const deleteBooking = useCallback(async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;

      // Invalidate cache and reload
      cacheRef.current = null;
      await loadBookings(true);
      toast.success("Booking deleted successfully");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  }, [loadBookings]);

  // Comment functions
  const addCommentToBooking = useCallback(async (bookingId: string, comment: Omit<Comment, "id">): Promise<string | undefined> => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          booking_id: bookingId,
          user_id: comment.userId,
          content: comment.content
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Invalidate cache and reload
        cacheRef.current = null;
        await loadBookings(true);
        toast.success("Comment added successfully");
        return data.id;
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      throw error;
    }
  }, [loadBookings]);

  const deleteCommentFromBooking = useCallback(async (bookingId: string, commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Invalidate cache and reload
      cacheRef.current = null;
      await loadBookings(true);
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  }, [loadBookings]);

  const applyDelay = useCallback(async (delayMinutes: number, startDateTime: Date) => {
    try {
      const startTime = startDateTime.getTime();
      
      const affectedBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start).getTime();
        return bookingStart >= startTime;
      });
      
      for (const booking of affectedBookings) {
        const bookingStart = new Date(booking.start).getTime();
        const bookingEnd = new Date(booking.end).getTime();
        
        const newStart = new Date(bookingStart + delayMinutes * 60 * 1000).toISOString();
        const newEnd = new Date(bookingEnd + delayMinutes * 60 * 1000).toISOString();
        
        await supabase
          .from('bookings')
          .update({
            start_time: newStart,
            end_time: newEnd,
          })
          .eq('id', booking.id);
      }
      
      // Invalidate cache and reload
      cacheRef.current = null;
      await loadBookings(true);
      
      toast.success(`Successfully applied ${delayMinutes} minute delay to ${affectedBookings.length} bookings`);
    } catch (error) {
      console.error("Error applying delay:", error);
      toast.error("Failed to apply delay to bookings");
      throw error;
    }
  }, [bookings, loadBookings]);

  return {
    bookings,
    setBookings,
    loadBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    addCommentToBooking,
    deleteCommentFromBooking,
    applyDelay,
    isLoading
  };
};
