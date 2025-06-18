
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from "react";
import { Instrument, Booking, BookingStatistics, Comment } from "../types";
import { useAuth } from "./AuthContext";
import { useOptimizedBookings } from "../hooks/useOptimizedBookings";
import { useOptimizedInstruments } from "../hooks/useOptimizedInstruments";
import { useBookingStatistics } from "../hooks/useBookingStatistics";
import { useStatusColors } from "../hooks/useStatusColors";

interface OptimizedBookingContextType {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  instruments: Instrument[];
  addInstrument: (instrumentData: Omit<Instrument, "id">) => Promise<void>;
  updateInstrument: (instrumentData: Instrument) => Promise<void>;
  deleteInstrument: (instrumentId: string) => Promise<void>;
  deleteBooking: (bookingId: string) => Promise<void>;
  createBooking: (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => Promise<any>;
  updateBooking: (bookingData: Booking) => Promise<void>;
  applyDelay: (delayMinutes: number, startDateTime: Date) => Promise<void>;
  statistics: BookingStatistics;
  addCommentToBooking: (bookingId: string, comment: Omit<Comment, "id">) => Promise<string | undefined>;
  deleteCommentFromBooking: (bookingId: string, commentId: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

export const OptimizedBookingContext = createContext<OptimizedBookingContextType>({
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

export const OptimizedBookingProvider = ({ children }: { children: React.ReactNode }) => {
  const { users, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use optimized hooks
  const instrumentsHook = useOptimizedInstruments();
  const bookingsHook = useOptimizedBookings(users);
  const { getStatusColor, loadStatusColors } = useStatusColors();
  
  const statistics = useBookingStatistics(bookingsHook.bookings, instrumentsHook.instruments);

  // Combined loading state
  const isLoading = useMemo(() => 
    authLoading || instrumentsHook.isLoading || bookingsHook.isLoading, 
    [authLoading, instrumentsHook.isLoading, bookingsHook.isLoading]
  );

  // Optimized refresh function
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) {
      console.log("Not authenticated, skipping data refresh");
      return;
    }
    
    console.log("OptimizedBookingContext: Starting data refresh");
    
    try {
      // Load data in parallel for better performance
      await Promise.all([
        instrumentsHook.loadInstruments(true),
        bookingsHook.loadBookings(true),
        loadStatusColors()
      ]);
      console.log("OptimizedBookingContext: Data refresh complete");
    } catch (error) {
      console.error("OptimizedBookingContext: Error refreshing data:", error);
    }
  }, [isAuthenticated, instrumentsHook, bookingsHook, loadStatusColors]);

  // Initialize data when authenticated and not already initialized
  useEffect(() => {
    if (isAuthenticated && !authLoading && !isInitialized) {
      console.log("OptimizedBookingContext: Initializing data for authenticated user");
      setIsInitialized(true);
      refreshData();
    } else if (!isAuthenticated && !authLoading) {
      console.log("OptimizedBookingContext: User not authenticated, resetting initialization");
      setIsInitialized(false);
    }
  }, [isAuthenticated, authLoading, isInitialized, refreshData]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    bookings: bookingsHook.bookings,
    setBookings: bookingsHook.setBookings,
    instruments: instrumentsHook.instruments,
    addInstrument: instrumentsHook.addInstrument,
    updateInstrument: instrumentsHook.updateInstrument,
    deleteInstrument: instrumentsHook.deleteInstrument,
    deleteBooking: bookingsHook.deleteBooking,
    createBooking: bookingsHook.createBooking,
    updateBooking: bookingsHook.updateBooking,
    applyDelay: bookingsHook.applyDelay,
    statistics,
    addCommentToBooking: bookingsHook.addCommentToBooking,
    deleteCommentFromBooking: bookingsHook.deleteCommentFromBooking,
    getStatusColor,
    isLoading,
    refreshData
  }), [
    bookingsHook,
    instrumentsHook,
    statistics,
    getStatusColor,
    isLoading,
    refreshData
  ]);

  return (
    <OptimizedBookingContext.Provider value={contextValue}>
      {children}
    </OptimizedBookingContext.Provider>
  );
};

export const useOptimizedBooking = () => useContext(OptimizedBookingContext);
