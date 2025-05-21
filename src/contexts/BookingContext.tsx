import React, { createContext, useContext, useState, useEffect } from "react";
import { Booking, Instrument, BookingStatistics } from "../types";

type BookingContextType = {
  instruments: Instrument[];
  bookings: Booking[];
  statistics: BookingStatistics;
  isLoading: boolean;
  createBooking: (booking: Omit<Booking, "id" | "createdAt">) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  getInstrumentAvailability: (instrumentId: string, date: Date) => { start: string; end: string }[];
  addInstrument: (instrument: Omit<Instrument, "id">) => Promise<void>;
  updateInstrument: (instrument: Instrument) => Promise<void>;
  applyDelay: (delayMinutes: number, startTime: Date) => Promise<void>;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Mock data for demonstration
const MOCK_INSTRUMENTS: Instrument[] = [
  {
    id: "1",
    name: "Orbitrap Eclipse",
    model: "Thermo Scientific Orbitrap Eclipse",
    location: "Lab A, Room 101",
    status: "available",
    description: "High-resolution accurate-mass (HRAM) mass spectrometer",
    calibrationDue: "2023-12-15",
  },
  {
    id: "2",
    name: "Triple TOF 6600",
    model: "SCIEX Triple TOF 6600",
    location: "Lab B, Room 205",
    status: "available",
    description: "High-resolution hybrid quadrupole time-of-flight mass spectrometer",
    calibrationDue: "2023-11-30",
  },
  {
    id: "3",
    name: "Q Exactive HF",
    model: "Thermo Scientific Q Exactive HF",
    location: "Lab A, Room 102",
    status: "maintenance",
    description: "Hybrid quadrupole-Orbitrap mass spectrometer",
    calibrationDue: "2023-10-20",
  },
];

// Generate some mock bookings over the next 2 weeks
const generateMockBookings = (): Booking[] => {
  const bookings: Booking[] = [];
  const now = new Date();
  
  // Generate a random booking for each day in the next 2 weeks
  for (let i = 0; i < 14; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    
    // Random instrument
    const instrumentIndex = Math.floor(Math.random() * MOCK_INSTRUMENTS.length);
    const instrument = MOCK_INSTRUMENTS[instrumentIndex];
    
    // Random start time between 9am and 4pm
    const startHour = Math.floor(Math.random() * 7) + 9;
    const start = new Date(date);
    start.setHours(startHour, 0, 0, 0);
    
    // Duration between 1-3 hours
    const durationHours = Math.floor(Math.random() * 3) + 1;
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    
    bookings.push({
      id: `booking-${i + 1}`,
      userId: Math.random() > 0.5 ? "1" : "2",
      userName: Math.random() > 0.5 ? "Admin User" : "John Researcher",
      instrumentId: instrument.id,
      instrumentName: instrument.name,
      start: start.toISOString(),
      end: end.toISOString(),
      purpose: "Sample analysis",
      status: "confirmed" as const,
      createdAt: new Date(start.getTime() - 86400000).toISOString(), // 1 day before
    });
  }
  
  return bookings;
};

const MOCK_BOOKINGS = generateMockBookings();

// Generate mock statistics
const generateMockStatistics = (bookings: Booking[]): BookingStatistics => {
  // Aggregate data
  const instrumentUsage: Record<string, { name: string; count: number; hours: number }> = {};
  const userBookings: Record<string, { name: string; count: number; hours: number }> = {};
  const weeklyUsage: Record<string, number> = {};
  
  bookings.forEach(booking => {
    // Instrument usage
    if (!instrumentUsage[booking.instrumentId]) {
      instrumentUsage[booking.instrumentId] = { name: booking.instrumentName, count: 0, hours: 0 };
    }
    instrumentUsage[booking.instrumentId].count += 1;
    
    const start = new Date(booking.start);
    const end = new Date(booking.end);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    instrumentUsage[booking.instrumentId].hours += durationHours;
    
    // User bookings
    if (!userBookings[booking.userId]) {
      userBookings[booking.userId] = { name: booking.userName, count: 0, hours: 0 };
    }
    userBookings[booking.userId].count += 1;
    userBookings[booking.userId].hours += durationHours;
    
    // Weekly usage
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() - start.getDay()); // Start of the week (Sunday)
    const weekKey = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
    
    if (!weeklyUsage[weekKey]) {
      weeklyUsage[weekKey] = 0;
    }
    weeklyUsage[weekKey] += 1;
  });
  
  return {
    totalBookings: bookings.length,
    instrumentUsage: Object.entries(instrumentUsage).map(([id, data]) => ({
      instrumentId: id,
      instrumentName: data.name,
      bookingCount: data.count,
      totalHours: data.hours
    })),
    userBookings: Object.entries(userBookings).map(([id, data]) => ({
      userId: id,
      userName: data.name,
      bookingCount: data.count,
      totalHours: data.hours
    })),
    weeklyUsage: Object.entries(weeklyUsage).map(([week, count]) => ({
      week,
      bookingCount: count
    }))
  };
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statistics, setStatistics] = useState<BookingStatistics>({
    totalBookings: 0,
    instrumentUsage: [],
    userBookings: [],
    weeklyUsage: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInstruments(MOCK_INSTRUMENTS);
      setBookings(MOCK_BOOKINGS);
      setStatistics(generateMockStatistics(MOCK_BOOKINGS));
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  const createBooking = async (bookingData: Omit<Booking, "id" | "createdAt">) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newBooking: Booking = {
      ...bookingData,
      id: `booking-${bookings.length + 1}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    setStatistics(generateMockStatistics(updatedBookings));
    setIsLoading(false);
  };

  const updateBooking = async (updatedBooking: Booking) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedBookings = bookings.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    
    setBookings(updatedBookings);
    setStatistics(generateMockStatistics(updatedBookings.filter(b => b.status !== "cancelled")));
    setIsLoading(false);
  };

  const cancelBooking = async (bookingId: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedBookings = bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: "cancelled" as const } : booking
    );
    
    setBookings(updatedBookings);
    setStatistics(generateMockStatistics(updatedBookings.filter(b => b.status !== "cancelled")));
    setIsLoading(false);
  };

  const getInstrumentAvailability = (instrumentId: string, date: Date) => {
    // Get bookings for the specified instrument and date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);
    
    const instrumentBookings = bookings.filter(booking => 
      booking.instrumentId === instrumentId &&
      booking.status !== "cancelled" &&
      new Date(booking.start) >= dateStart &&
      new Date(booking.start) <= dateEnd
    );
    
    // Return the booked time slots
    return instrumentBookings.map(booking => ({
      start: booking.start,
      end: booking.end
    }));
  };

  const addInstrument = async (instrumentData: Omit<Instrument, "id">) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newInstrument: Instrument = {
      ...instrumentData,
      id: `instrument-${instruments.length + 1}`,
    };
    
    setInstruments([...instruments, newInstrument]);
    setIsLoading(false);
  };

  const updateInstrument = async (updatedInstrument: Instrument) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedInstruments = instruments.map(instrument => 
      instrument.id === updatedInstrument.id ? updatedInstrument : instrument
    );
    
    setInstruments(updatedInstruments);
    setIsLoading(false);
  };

  const applyDelay = async (delayMinutes: number, startTime: Date) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedBookings = bookings.map(booking => {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      
      // Only delay bookings that start after the startTime
      if (bookingStart >= startTime) {
        const newStart = new Date(bookingStart);
        const newEnd = new Date(bookingEnd);
        
        newStart.setMinutes(newStart.getMinutes() + delayMinutes);
        newEnd.setMinutes(newEnd.getMinutes() + delayMinutes);
        
        return {
          ...booking,
          start: newStart.toISOString(),
          end: newEnd.toISOString(),
        };
      }
      return booking;
    });
    
    setBookings(updatedBookings);
    setIsLoading(false);
  };

  return (
    <BookingContext.Provider
      value={{
        instruments,
        bookings,
        statistics,
        isLoading,
        createBooking,
        updateBooking,
        cancelBooking,
        getInstrumentAvailability,
        addInstrument,
        updateInstrument,
        applyDelay
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
};
