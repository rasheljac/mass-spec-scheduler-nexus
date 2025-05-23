
import { useState, useCallback } from "react";
import { Booking, Comment, User } from "../types";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

export const useBookings = (users: User[]) => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Helper function to find user email by userId
  const getUserEmailById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.email || "";
  };

  // Helper function to find user name by userId
  const getUserNameById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.name || "Unknown User";
  };

  // Load bookings from Supabase
  const loadBookings = useCallback(async () => {
    try {
      console.log("Loading bookings from Supabase");
      const { data, error } = await supabase
        .from('bookings')
        .select('*');

      if (error) {
        throw error;
      }
      
      // Transform Supabase data to match our Booking type
      if (data) {
        const bookingsWithComments: Booking[] = [];
        
        for (const booking of data) {
          try {
            // Get the instrument name for each booking
            const { data: instrumentData } = await supabase
              .from('instruments')
              .select('name')
              .eq('id', booking.instrument_id)
              .single();
              
            // Get the user name for each booking
            const { data: userData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', booking.user_id)
              .single();
              
            // Get comments for this booking
            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select('*')
              .eq('booking_id', booking.id);
              
            if (commentsError) {
              console.error("Error fetching comments:", commentsError);
            }
              
            const formattedComments: Comment[] = [];
            
            if (commentsData) {
              // Fetch user names for each comment
              for (const comment of commentsData) {
                try {
                  const { data: commentUserData } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', comment.user_id)
                    .single();
                    
                  formattedComments.push({
                    id: comment.id,
                    userId: comment.user_id,
                    userName: commentUserData ? commentUserData.name : getUserNameById(comment.user_id),
                    content: comment.content,
                    createdAt: new Date(comment.created_at).toISOString()
                  });
                } catch (e) {
                  console.error("Error processing comment user data:", e);
                }
              }
            }
              
            const formattedBooking: Booking = {
              id: booking.id,
              userId: booking.user_id,
              userName: userData ? userData.name : "Unknown User",
              instrumentId: booking.instrument_id,
              instrumentName: instrumentData ? instrumentData.name : "Unknown Instrument",
              start: new Date(booking.start_time).toISOString(),
              end: new Date(booking.end_time).toISOString(),
              purpose: booking.purpose,
              status: booking.status,
              createdAt: new Date(booking.created_at).toISOString(),
              details: booking.details || "",
              comments: formattedComments
            };
            
            bookingsWithComments.push(formattedBooking);
          } catch (e) {
            console.error("Error processing booking:", e, booking);
          }
        }
        
        console.log(`Loaded ${bookingsWithComments.length} bookings from Supabase`);
        setBookings(bookingsWithComments);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    }
  }, [users]);

  // Function to create a booking
  const createBooking = async (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => {
    try {
      console.log("Creating booking with data:", bookingData);
      
      // Insert into Supabase
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

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (data && data[0]) {
        console.log("Booking created successfully:", data[0]);
        
        // Reload bookings to get the updated list
        await loadBookings();
        
        // Send email notification for new booking
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: getUserEmailById(bookingData.userId),
              templateType: 'booking_confirmation',
              variables: {
                userName: bookingData.userName,
                instrumentName: bookingData.instrumentName,
                startDate: new Date(bookingData.start).toLocaleString(),
                endDate: new Date(bookingData.end).toLocaleString(),
                status: bookingData.status
              }
            }
          });
        } catch (emailError) {
          console.error("Failed to send booking confirmation email:", emailError);
        }
        
        toast.success("Booking created successfully");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create booking");
      throw error;
    }
  };

  // Function to update a booking
  const updateBooking = async (bookingData: Booking) => {
    try {
      // Find the existing booking to compare status
      const existingBooking = bookings.find(booking => booking.id === bookingData.id);
      const statusChanged = existingBooking && existingBooking.status !== bookingData.status;
      
      // Update in Supabase
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

      if (error) {
        throw error;
      }

      // Reload bookings to get the updated list
      await loadBookings();
      
      // Send status update notification if status has changed
      if (statusChanged) {
        try {
          await supabase.functions.invoke('send-email', {
            body: {
              to: getUserEmailById(bookingData.userId),
              templateType: 'booking_update',
              variables: {
                userName: bookingData.userName,
                instrumentName: bookingData.instrumentName,
                startDate: new Date(bookingData.start).toLocaleString(),
                endDate: new Date(bookingData.end).toLocaleString(),
                status: bookingData.status
              }
            }
          });
        } catch (emailError) {
          console.error("Failed to send booking update email:", emailError);
        }
      }
      
      toast.success("Booking updated successfully");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
      throw error;
    }
  };

  // Function to delete a booking
  const deleteBooking = async (bookingId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      // Reload bookings to get the updated list
      await loadBookings();
      toast.success("Booking deleted successfully");
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to delete booking");
    }
  };

  // Function to add a comment to a booking
  const addCommentToBooking = async (bookingId: string, comment: Omit<Comment, "id">) => {
    try {
      console.log("Adding comment to booking:", bookingId, comment);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('comments')
        .insert({
          booking_id: bookingId,
          user_id: comment.userId,
          content: comment.content
        })
        .select();

      if (error) {
        console.error("Error inserting comment:", error);
        throw error;
      }

      if (data && data[0]) {
        console.log("Comment added successfully:", data[0]);
        
        // Reload bookings to get the updated comments
        await loadBookings();
        return data[0].id; // Return the new comment ID
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      throw error;
    }
  };

  // Function to delete a comment from a booking
  const deleteCommentFromBooking = async (bookingId: string, commentId: string) => {
    try {
      console.log("Deleting comment:", commentId, "from booking:", bookingId);
      
      // Delete from Supabase
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error("Error deleting comment:", error);
        throw error;
      }

      console.log("Comment deleted successfully");
      
      // Reload bookings to get the updated comments
      await loadBookings();
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
      throw error;
    }
  };

  // Function to apply delay to bookings after a certain time
  const applyDelay = async (delayMinutes: number, startDateTime: Date) => {
    try {
      const startTime = startDateTime.getTime();
      
      // Get bookings that will be affected by the delay
      const affectedBookingsData = bookings.filter(booking => {
        const bookingStart = new Date(booking.start).getTime();
        return bookingStart >= startTime;
      });
      
      // Update all affected bookings
      for (const booking of affectedBookingsData) {
        const bookingStart = new Date(booking.start).getTime();
        const bookingEnd = new Date(booking.end).getTime();
        
        if (bookingStart >= startTime) {
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
      }
      
      // Reload bookings to get the updated list
      await loadBookings();
      
      // Send delay notifications to affected users
      affectedBookingsData.forEach(booking => {
        const userEmail = getUserEmailById(booking.userId);
        if (userEmail) {
          const notification = createDelayNotification(
            userEmail,
            booking.userName,
            booking.instrumentName,
            delayMinutes
          );
          sendEmail(notification).catch(error => console.error("Failed to send delay notification:", error));
        }
      });
      
      toast.success(`Successfully applied ${delayMinutes} minute delay to ${affectedBookingsData.length} bookings`);
    } catch (error) {
      console.error("Error applying delay:", error);
      toast.error("Failed to apply delay to bookings");
      throw error;
    }
  };

  return {
    bookings,
    setBookings,
    loadBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    addCommentToBooking,
    deleteCommentFromBooking,
    applyDelay
  };
};
