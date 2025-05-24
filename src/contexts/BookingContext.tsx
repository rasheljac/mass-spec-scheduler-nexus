
import React, { createContext, useState, useContext, useEffect } from "react";
import { Instrument, Booking, BookingStatistics, Comment } from "../types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { useInstruments } from "../hooks/useInstruments";
import { useBookings } from "../hooks/useBookings";
import { useBookingStatistics } from "../hooks/useBookingStatistics";
import { useStatusColors } from "../hooks/useStatusColors";

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
  addCommentToBooking: (bookingId: string, comment: Omit<Comment, "id">) => Promise<string | undefined>;
  deleteCommentFromBooking: (bookingId: string, commentId: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  isLoading: boolean;
  refreshData: () => Promise<void>;
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
  addCommentToBooking: async () => undefined,
  deleteCommentFromBooking: async () => {},
  getStatusColor: () => '#6b7280',
  isLoading: true,
  refreshData: async () => {}
});

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, users, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use our custom hooks
  const { 
    instruments, 
    addInstrument, 
    updateInstrument, 
    deleteInstrument, 
    loadInstruments 
  } = useInstruments();
  
  const { 
    bookings, 
    setBookings, 
    createBooking, 
    updateBooking, 
    deleteBooking,
    addCommentToBooking,
    deleteCommentFromBooking,
    loadBookings,
    applyDelay
  } = useBookings(users);
  
  const { statusColors, loadStatusColors, getStatusColor } = useStatusColors();
  
  const statistics = useBookingStatistics(bookings, instruments);

  // Function to refresh all data
  const refreshData = async () => {
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping data refresh");
      return;
    }
    
    console.log("Refreshing all data...");
    setIsLoading(true);
    try {
      await Promise.all([
        loadInstruments(),
        loadBookings(),
        loadStatusColors()
      ]);
      console.log("Data refresh complete");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      // Skip if auth is still loading or user is not authenticated
      if (authLoading || !isAuthenticated) {
        console.log("Auth not ready, skipping initial data load");
        // If auth is done loading and user is not authenticated, we can stop loading
        if (!authLoading && !isAuthenticated) {
          setIsLoading(false);
          setHasInitialized(true);
        }
        return;
      }
      
      // Skip if already initialized
      if (hasInitialized) {
        console.log("Already initialized, skipping initial data load");
        return;
      }
      
      console.log("Loading initial data for user:", user?.id);
      setIsLoading(true);
      try {
        await Promise.all([
          loadInstruments(),
          loadBookings(),
          loadStatusColors()
        ]);
        console.log("Initial data loading complete");
        setHasInitialized(true);
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [authLoading, isAuthenticated, user, hasInitialized, loadInstruments, loadBookings, loadStatusColors]);

  // Reset initialization when auth state changes
  useEffect(() => {
    if (authLoading) {
      setHasInitialized(false);
    }
  }, [authLoading]);

  // Debug logging
  useEffect(() => {
    console.log("BookingContext state:", {
      isLoading,
      authLoading,
      isAuthenticated,
      hasInitialized,
      bookingsCount: bookings.length,
      instrumentsCount: instruments.length
    });
  }, [isLoading, authLoading, isAuthenticated, hasInitialized, bookings.length, instruments.length]);

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
      getStatusColor,
      isLoading,
      refreshData
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
