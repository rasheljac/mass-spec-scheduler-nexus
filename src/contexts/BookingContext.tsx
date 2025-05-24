
import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
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
  const { users, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
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
  
  const { getStatusColor, loadStatusColors } = useStatusColors();
  
  const statistics = useBookingStatistics(bookings, instruments);

  // Memoize the refresh function
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping data refresh");
      setIsLoading(false);
      return;
    }
    
    console.log("BookingContext: Starting data refresh");
    setIsLoading(true);
    
    try {
      await Promise.all([
        loadInstruments(),
        loadBookings(),
        loadStatusColors()
      ]);
      console.log("BookingContext: Data refresh complete");
    } catch (error) {
      console.error("BookingContext: Error refreshing data:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, loadInstruments, loadBookings, loadStatusColors]);

  // Initial data load
  useEffect(() => {
    const initializeData = async () => {
      // Don't initialize if already done or if auth is loading
      if (isInitialized || authLoading) {
        return;
      }
      
      // If not authenticated, stop loading
      if (!isAuthenticated) {
        console.log("BookingContext: Not authenticated, stopping loading");
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }
      
      console.log("BookingContext: Initializing data");
      await refreshData();
      setIsInitialized(true);
    };

    initializeData();
  }, [authLoading, isAuthenticated, isInitialized, refreshData]);

  // Reset when auth changes
  useEffect(() => {
    if (authLoading) {
      setIsInitialized(false);
    }
  }, [authLoading]);

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
