
import React, { createContext, useState, useContext, useEffect } from "react";
import { Instrument, Booking, BookingStatistics, Comment } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, createBookingNotification, createStatusUpdateNotification, createDelayNotification } from "../utils/emailNotifications";
import { useAuth } from "./AuthContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

interface BookingContextType {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  instruments: Instrument[];
  addInstrument: (instrumentData: Omit<Instrument, "id">) => Promise<void>;
  updateInstrument: (instrumentData: Instrument) => Promise<void>;
  deleteInstrument: (instrumentId: string) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  createBooking: (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => Promise<void>;
  updateBooking: (bookingData: Booking) => Promise<void>;
  applyDelay: (delayMinutes: number, startDateTime: Date) => Promise<void>;
  statistics: BookingStatistics;
  addCommentToBooking: (bookingId: string, comment: Omit<Comment, "id">) => Promise<void>;
  deleteCommentFromBooking: (bookingId: string, commentId: string) => Promise<void>;
}

export const BookingContext = createContext<BookingContextType>({
  bookings: [],
  setBookings: () => {},
  instruments: [],
  addInstrument: async () => {},
  updateInstrument: async () => {},
  deleteInstrument: async () => {},
  deleteBooking: async () => {},
  createBooking: async () => {},
  updateBooking: async () => {},
  applyDelay: async () => {},
  statistics: {
    totalBookings: 0,
    instrumentUsage: [],
    userBookings: [],
    weeklyUsage: []
  },
  addCommentToBooking: async () => {},
  deleteCommentFromBooking: async () => {},
});

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, users } = useAuth();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to find user email by userId
  const getUserEmailById = (userId: string): string => {
    const user = users.find(u => u.id === userId);
    return user?.email || "";
  };

  // Load instruments and bookings from Supabase on initialization
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadInstruments();
        await loadBookings();
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Load instruments from Supabase
  const loadInstruments = async () => {
    try {
      const { data, error } = await supabase
        .from('instruments')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        // Transform Supabase data to match our Instrument type
        const formattedInstruments: Instrument[] = data.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type || "",
          model: item.model || "",
          location: item.location,
          status: item.status,
          image: item.image || "",
          description: item.description,
          specifications: item.specifications,
          calibrationDue: item.calibration_due ? new Date(item.calibration_due).toISOString() : undefined,
          maintenanceHistory: []
        }));
        
        // Load maintenance history for each instrument
        for (const instrument of formattedInstruments) {
          const { data: maintenanceData, error: maintenanceError } = await supabase
            .from('maintenance_history')
            .select('*')
            .eq('instrument_id', instrument.id);
            
          if (maintenanceError) {
            console.error("Error fetching maintenance history:", maintenanceError);
          } else if (maintenanceData) {
            instrument.maintenanceHistory = maintenanceData.map(item => ({
              date: new Date(item.date).toISOString().split('T')[0],
              description: item.description
            }));
          }
        }
        
        setInstruments(formattedInstruments);
      }
    } catch (error) {
      console.error("Error loading instruments:", error);
      toast.error("Failed to load instruments");
    }
  };
  
  // Load bookings from Supabase
  const loadBookings = async () => {
    try {
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
            comments: commentsData ? commentsData.map(comment => ({
              id: comment.id,
              userId: comment.user_id,
              content: comment.content,
              createdAt: new Date(comment.created_at).toISOString()
            })) : []
          };
          
          bookingsWithComments.push(formattedBooking);
        }
        
        setBookings(bookingsWithComments);
      }
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast.error("Failed to load bookings");
    }
  };

  // Function to add a new instrument
  const addInstrument = async (instrumentData: Omit<Instrument, "id">) => {
    try {
      // Insert into Supabase
      const { data, error } = await supabase
        .from('instruments')
        .insert({
          name: instrumentData.name,
          type: instrumentData.type,
          model: instrumentData.model,
          location: instrumentData.location,
          status: instrumentData.status,
          image: instrumentData.image,
          description: instrumentData.description,
          specifications: instrumentData.specifications,
          calibration_due: instrumentData.calibrationDue
        })
        .select();

      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        // Add maintenance history if present
        if (instrumentData.maintenanceHistory && instrumentData.maintenanceHistory.length > 0) {
          for (const maintenance of instrumentData.maintenanceHistory) {
            await supabase
              .from('maintenance_history')
              .insert({
                instrument_id: data[0].id,
                date: maintenance.date,
                description: maintenance.description
              });
          }
        }

        // Reload instruments to get the updated list
        await loadInstruments();
        toast.success("Instrument added successfully");
      }
    } catch (error) {
      console.error("Error adding instrument:", error);
      toast.error("Failed to add instrument");
    }
  };

  // Function to update an existing instrument
  const updateInstrument = async (instrumentData: Instrument) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('instruments')
        .update({
          name: instrumentData.name,
          type: instrumentData.type,
          model: instrumentData.model,
          location: instrumentData.location,
          status: instrumentData.status,
          image: instrumentData.image,
          description: instrumentData.description,
          specifications: instrumentData.specifications,
          calibration_due: instrumentData.calibrationDue
        })
        .eq('id', instrumentData.id);

      if (error) {
        throw error;
      }
      
      // Update maintenance history
      if (instrumentData.maintenanceHistory) {
        // Delete existing maintenance history
        await supabase
          .from('maintenance_history')
          .delete()
          .eq('instrument_id', instrumentData.id);
          
        // Add updated maintenance history
        for (const maintenance of instrumentData.maintenanceHistory) {
          await supabase
            .from('maintenance_history')
            .insert({
              instrument_id: instrumentData.id,
              date: maintenance.date,
              description: maintenance.description
            });
        }
      }

      // Reload instruments to get the updated list
      await loadInstruments();
      toast.success("Instrument updated successfully");
    } catch (error) {
      console.error("Error updating instrument:", error);
      toast.error("Failed to update instrument");
    }
  };

  // Function to delete an instrument
  const deleteInstrument = async (instrumentId: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('instruments')
        .delete()
        .eq('id', instrumentId);

      if (error) {
        throw error;
      }

      // Reload instruments to get the updated list
      await loadInstruments();
      toast.success("Instrument deleted successfully");
    } catch (error) {
      console.error("Error deleting instrument:", error);
      toast.error("Failed to delete instrument");
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

  // Function to create a booking
  const createBooking = async (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => {
    try {
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
        throw error;
      }
      
      if (data && data[0]) {
        // Reload bookings to get the updated list
        await loadBookings();
        
        // Send email notification for new booking
        const userEmail = getUserEmailById(bookingData.userId);
        if (userEmail) {
          const notification = createBookingNotification(
            userEmail,
            bookingData.userName,
            bookingData.instrumentName,
            bookingData.start,
            bookingData.end
          );
          sendEmail(notification).catch(error => console.error("Failed to send booking notification:", error));
        }
        
        toast.success("Booking created successfully");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
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
        const userEmail = getUserEmailById(bookingData.userId);
        if (userEmail) {
          const notification = createStatusUpdateNotification(
            userEmail,
            bookingData.userName,
            bookingData.instrumentName,
            bookingData.status
          );
          sendEmail(notification).catch(error => console.error("Failed to send status update notification:", error));
        }
      }
      
      toast.success("Booking updated successfully");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
      throw error;
    }
  };

  // Function to add a comment to a booking
  const addCommentToBooking = async (bookingId: string, comment: Omit<Comment, "id">) => {
    try {
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
        throw error;
      }

      if (data && data[0]) {
        // Reload bookings to get the updated comments
        await loadBookings();
        toast.success("Comment added successfully");
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
      // Delete from Supabase
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      // Reload bookings to get the updated comments
      await loadBookings();
      toast.success("Comment deleted successfully");
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

  // Function to calculate booking statistics
  const calculateStatistics = (): BookingStatistics => {
    const totalBookings = bookings.length;

    // Instrument Usage
    const instrumentUsageMap = new Map<string, { instrumentName: string, bookingCount: number, totalHours: number }>();
    instruments.forEach(instrument => {
      instrumentUsageMap.set(instrument.id, { instrumentName: instrument.name, bookingCount: 0, totalHours: 0 });
    });

    bookings.forEach(booking => {
      const instrumentStats = instrumentUsageMap.get(booking.instrumentId);
      if (instrumentStats) {
        instrumentStats.bookingCount++;
        const start = new Date(booking.start);
        const end = new Date(booking.end);
        instrumentStats.totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    const instrumentUsage = Array.from(instrumentUsageMap.entries()).map(([instrumentId, data]) => ({
      instrumentId,
      instrumentName: data.instrumentName,
      bookingCount: data.bookingCount,
      totalHours: data.totalHours
    })).sort((a, b) => b.totalHours - a.totalHours);

    // User Bookings
    const userBookingsMap = new Map<string, { userName: string, bookingCount: number, totalHours: number }>();
    bookings.forEach(booking => {
      if (!userBookingsMap.has(booking.userId)) {
        userBookingsMap.set(booking.userId, { userName: booking.userName, bookingCount: 0, totalHours: 0 });
      }
      const userStats = userBookingsMap.get(booking.userId);
      if (userStats) {
        userStats.bookingCount++;
        const start = new Date(booking.start);
        const end = new Date(booking.end);
        userStats.totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });

    const userBookings = Array.from(userBookingsMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      bookingCount: data.bookingCount,
      totalHours: data.totalHours
    })).sort((a, b) => b.totalHours - a.totalHours);

    // Weekly Usage
    const weeklyUsageMap = new Map<string, number>();
    bookings.forEach(booking => {
      const start = new Date(booking.start);
      const week = `${start.getFullYear()}-W${getWeek(start)}`;
      weeklyUsageMap.set(week, (weeklyUsageMap.get(week) || 0) + 1);
    });

    const weeklyUsage = Array.from(weeklyUsageMap.entries()).map(([week, bookingCount]) => ({
      week,
      bookingCount
    })).sort((a, b) => a.week.localeCompare(b.week));

    return {
      totalBookings,
      instrumentUsage,
      userBookings,
      weeklyUsage
    };
  };

  // Helper function to get week number
  const getWeek = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  };

  const [statistics, setStatistics] = useState<BookingStatistics>(calculateStatistics());

  useEffect(() => {
    setStatistics(calculateStatistics());
  }, [bookings, instruments]);
  
  return (
    <BookingContext.Provider value={{
      bookings,
      setBookings,
      instruments,
      addInstrument,
      updateInstrument,
      deleteInstrument,
      deleteBooking,
      createBooking,
      updateBooking,
      applyDelay,
      statistics,
      addCommentToBooking,
      deleteCommentFromBooking,
    }}>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mslab-400"></div>
        </div>
      ) : (
        children
      )}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
