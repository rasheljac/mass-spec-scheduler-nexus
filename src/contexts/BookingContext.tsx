
import React, { createContext, useState, useContext, useEffect } from "react";
import { Instrument, Booking, BookingStatistics, Comment } from "../types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import { useInstruments } from "../hooks/useInstruments";
import { useBookings } from "../hooks/useBookings";
import { useBookingStatistics } from "../hooks/useBookingStatistics";

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
  addCommentToBooking: async () => {},
  deleteCommentFromBooking: async () => {},
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
  
  const statistics = useBookingStatistics(bookings, instruments);

  // Load instruments and bookings from Supabase on initialization
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) {
        console.log("Auth is still loading, waiting...");
        setIsLoading(true);
        return; // Wait until auth loading is complete
      }
      
      // If not authenticated, don't try to load data
      if (!isAuthenticated) {
        console.log("Not authenticated, skipping data load");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        if (user) {
          console.log("Loading instruments and bookings data for user:", user.id);
          await Promise.all([
            loadInstruments(),
            loadBookings()
          ]);
          console.log("Data loading complete");
        } else {
          console.log("No user available, skipping data loading");
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load scheduling data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, authLoading, loadInstruments, loadBookings, isAuthenticated]);

  // Debug loading states
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
      isLoading
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
