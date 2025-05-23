
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
  isLoading: true
});

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, users, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const { loadStatusColors, getStatusColor } = useStatusColors();
  
  const statistics = useBookingStatistics(bookings, instruments);

  // Load instruments, bookings, and status colors from Supabase when authenticated
  useEffect(() => {
    const loadData = async () => {
      // Only attempt to load data when auth is not loading and user is authenticated
      if (authLoading || !isAuthenticated) {
        console.log("Auth not ready or not authenticated, skipping data load");
        if (!authLoading && !isAuthenticated) {
          // If auth loading is complete and user is not authenticated,
          // we can set isLoading to false since we don't need to load data
          setIsLoading(false);
        }
        return;
      }
      
      setIsLoading(true);
      try {
        console.log("Loading instruments, bookings, and status colors data for user:", user?.id);
        await Promise.all([
          loadInstruments(),
          loadBookings(),
          loadStatusColors()
        ]);
        console.log("Data loading complete");
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authLoading, isAuthenticated, user, loadInstruments, loadBookings, loadStatusColors]);

  // Debug logging
  useEffect(() => {
    console.log("BookingContext loading state:", isLoading);
    console.log("Auth loading state:", authLoading);
    console.log("Is authenticated:", isAuthenticated);
  }, [isLoading, authLoading, isAuthenticated]);

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
      isLoading
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
