
import React, { createContext, useState, useContext, useEffect } from "react";
import { Instrument, Booking, BookingStatistics } from "../types";
import { v4 as uuidv4 } from 'uuid';

interface BookingContextType {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  instruments: Instrument[];
  addInstrument: (instrumentData: Omit<Instrument, "id">) => void;
  updateInstrument: (instrumentData: Instrument) => void;
  deleteInstrument: (instrumentId: string) => void;
  deleteBooking: (bookingId: string) => void;
  createBooking: (bookingData: Omit<Booking, "id" | "createdAt"> & { status: "pending" | "confirmed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed" }) => Promise<void>;
  updateBooking: (bookingData: Booking) => Promise<void>;
  applyDelay: (delayMinutes: number, startDateTime: Date) => Promise<void>;
  statistics: BookingStatistics;
}

export const BookingContext = createContext<BookingContextType>({
  bookings: [],
  setBookings: () => {},
  instruments: [],
  addInstrument: () => {},
  updateInstrument: () => {},
  deleteInstrument: () => {},
  deleteBooking: () => {},
  createBooking: async () => {},
  updateBooking: async () => {},
  applyDelay: async () => {},
  statistics: {
    totalBookings: 0,
    instrumentUsage: [],
    userBookings: [],
    weeklyUsage: []
  },
});

const initialInstruments: Instrument[] = [
  {
    id: "1",
    name: "Mass Spectrometer A",
    type: "Mass Spectrometer", // Added type property
    model: "AB Sciex 6500+",
    location: "Lab 101",
    status: "available",
    image: "/lovable-uploads/mass-spec-1.png",
    description: "High-resolution mass spectrometer for proteomics and metabolomics.",
    calibrationDue: "2024-12-31",
    maintenanceHistory: [
      { date: "2023-11-15", description: "Replaced ion source." },
      { date: "2023-06-01", description: "Cleaned mass analyzer." }
    ]
  },
  {
    id: "2",
    name: "Flow Cytometer X20",
    type: "Flow Cytometer", // Added type property
    model: "BD FACSAria Fusion",
    location: "Lab 102",
    status: "maintenance",
    image: "/lovable-uploads/flow-cytometer-1.png",
    description: "Cell analyzer and sorter with multiple lasers.",
    calibrationDue: "2024-11-30",
    maintenanceHistory: [
      { date: "2023-10-20", description: "Laser alignment." },
      { date: "2023-05-10", description: "Replaced filters." }
    ]
  },
  {
    id: "3",
    name: "Confocal Microscope SP8",
    type: "Microscope", // Added type property
    model: "Leica TCS SP8",
    location: "Imaging Suite",
    status: "in-use",
    image: "/lovable-uploads/confocal-microscope-1.png",
    description: "Advanced confocal microscope for high-resolution imaging.",
    calibrationDue: "2025-01-15",
    maintenanceHistory: [
      { date: "2023-12-01", description: "Objective lens cleaning." },
      { date: "2023-07-01", description: "Laser power calibration." }
    ]
  },
  {
    id: "4",
    name: "Electron Microscope TEM",
    type: "Microscope", // Added type property
    model: "Thermo Fisher Talos",
    location: "EM Facility",
    status: "available",
    image: "/lovable-uploads/electron-microscope-1.png",
    description: "Transmission electron microscope for ultrastructural analysis.",
    calibrationDue: "2024-10-31",
    maintenanceHistory: [
      { date: "2023-09-25", description: "Column alignment." },
      { date: "2023-04-15", description: "Vacuum system maintenance." }
    ]
  },
  {
    id: "5",
    name: "NMR Spectrometer 600",
    type: "NMR Spectrometer", // Added type property
    model: "Bruker Avance III",
    location: "NMR Facility",
    status: "available",
    image: "/lovable-uploads/nmr-spectrometer-1.png",
    description: "600 MHz NMR spectrometer for structural analysis.",
    calibrationDue: "2024-09-30",
    maintenanceHistory: [
      { date: "2023-08-20", description: "Cryostat refill." },
      { date: "2023-03-10", description: "Probe tuning." }
    ]
  }
];

const initialBookings: Booking[] = [
  {
    id: "b1",
    userId: "2",
    userName: "John Researcher",
    instrumentId: "1",
    instrumentName: "Mass Spectrometer A",
    start: "2024-08-05T09:00:00",
    end: "2024-08-05T17:00:00",
    purpose: "Proteomics sample analysis",
    status: "confirmed",
    createdAt: "2024-07-20T14:30:00",
    details: "Running samples for protein identification."
  },
  {
    id: "b2",
    userId: "3",
    userName: "Sarah Scientist",
    instrumentId: "2",
    instrumentName: "Flow Cytometer X20",
    start: "2024-08-06T10:00:00",
    end: "2024-08-06T14:00:00",
    purpose: "Cell sorting experiment",
    status: "pending",
    createdAt: "2024-07-22T09:15:00",
    details: "Sorting T-cells for downstream analysis."
  },
  {
    id: "b3",
    userId: "2",
    userName: "John Researcher",
    instrumentId: "3",
    instrumentName: "Confocal Microscope SP8",
    start: "2024-08-07T13:00:00",
    end: "2024-08-07T16:00:00",
    purpose: "Imaging of fixed cells",
    status: "confirmed",
    createdAt: "2024-07-25T16:45:00",
    details: "High-resolution imaging of stained cells."
  },
  {
    id: "b4",
    userId: "3",
    userName: "Sarah Scientist",
    instrumentId: "4",
    instrumentName: "Electron Microscope TEM",
    start: "2024-08-08T09:00:00",
    end: "2024-08-08T12:00:00",
    purpose: "TEM analysis of nanoparticles",
    status: "confirmed",
    createdAt: "2024-07-28T11:20:00",
    details: "Analyzing the structure of synthesized nanoparticles."
  },
  {
    id: "b5",
    userId: "2",
    userName: "John Researcher",
    instrumentId: "5",
    instrumentName: "NMR Spectrometer 600",
    start: "2024-08-09T14:00:00",
    end: "2024-08-09T18:00:00",
    purpose: "NMR analysis of small molecules",
    status: "confirmed",
    createdAt: "2024-07-30T18:55:00",
    details: "Running NMR to determine molecular structure."
  },
  {
    id: "b6",
    userId: "3",
    userName: "Sarah Scientist",
    instrumentId: "1",
    instrumentName: "Mass Spectrometer A",
    start: "2024-08-10T10:00:00",
    end: "2024-08-10T16:00:00",
    purpose: "Metabolomics profiling",
    status: "confirmed",
    createdAt: "2024-08-01T08:40:00",
    details: "Profiling metabolites in cell culture samples."
  },
  {
    id: "b7",
    userId: "2",
    userName: "John Researcher",
    instrumentId: "2",
    instrumentName: "Flow Cytometer X20",
    start: "2024-08-11T11:00:00",
    end: "2024-08-11T15:00:00",
    purpose: "Apoptosis assay",
    status: "confirmed",
    createdAt: "2024-08-02T15:00:00",
    details: "Measuring apoptosis in treated cells."
  },
  {
    id: "b8",
    userId: "3",
    userName: "Sarah Scientist",
    instrumentId: "3",
    instrumentName: "Confocal Microscope SP8",
    start: "2024-08-12T14:00:00",
    end: "2024-08-12T17:00:00",
    purpose: "Live cell imaging",
    status: "confirmed",
    createdAt: "2024-08-03T21:30:00",
    details: "Time-lapse imaging of live cells."
  },
  {
    id: "b9",
    userId: "2",
    userName: "John Researcher",
    instrumentId: "4",
    instrumentName: "Electron Microscope TEM",
    start: "2024-08-13T09:00:00",
    end: "2024-08-13T13:00:00",
    purpose: "High-resolution imaging",
    status: "confirmed",
    createdAt: "2024-08-04T07:00:00",
    details: "Acquiring high-resolution images of materials."
  },
  {
    id: "b10",
    userId: "3",
    userName: "Sarah Scientist",
    instrumentId: "5",
    instrumentName: "NMR Spectrometer 600",
    start: "2024-08-14T15:00:00",
    end: "2024-08-14T19:00:00",
    purpose: "Complex mixture analysis",
    status: "confirmed",
    createdAt: "2024-08-05T14:45:00",
    details: "Analyzing complex mixtures using NMR."
  }
];

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  // Load bookings and instruments from localStorage on initialization or use defaults
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const savedBookings = localStorage.getItem('mslab_bookings');
    return savedBookings ? JSON.parse(savedBookings) : initialBookings;
  });
  
  const [instruments, setInstruments] = useState<Instrument[]>(() => {
    const savedInstruments = localStorage.getItem('mslab_instruments');
    return savedInstruments ? JSON.parse(savedInstruments) : initialInstruments;
  });

  // Save bookings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mslab_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Save instruments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mslab_instruments', JSON.stringify(instruments));
  }, [instruments]);

  // Function to add a new instrument
  const addInstrument = (instrumentData: Omit<Instrument, "id">) => {
    const newInstrument: Instrument = {
      id: uuidv4(),
      ...instrumentData
    };
    setInstruments(prevInstruments => [...prevInstruments, newInstrument]);
  };

  // Function to update an existing instrument
  const updateInstrument = (instrumentData: Instrument) => {
    setInstruments(prevInstruments =>
      prevInstruments.map(instrument =>
        instrument.id === instrumentData.id ? instrumentData : instrument
      )
    );
  };

  // Add function to delete an instrument
  const deleteInstrument = (instrumentId: string) => {
    setInstruments(prevInstruments => 
      prevInstruments.filter(instrument => instrument.id !== instrumentId)
    );
  };

  // Function to delete a booking
  const deleteBooking = (bookingId: string) => {
    setBookings(prevBookings =>
      prevBookings.filter(booking => booking.id !== bookingId)
    );
  };

  // Function to create a booking
  const createBooking = async (bookingData: Omit<Booking, "id" | "createdAt" | "status"> & { status: "Not-Started" | "In-Progress" | "Completed" | "Delayed" | "confirmed" | "pending" | "cancelled" }) => {
    return new Promise<void>((resolve) => {
      const newBooking: Booking = {
        id: uuidv4(),
        ...bookingData,
        createdAt: new Date().toISOString(),
      };
      
      setBookings(prevBookings => [...prevBookings, newBooking]);
      
      // Simulate API delay
      setTimeout(() => {
        resolve();
      }, 500);
    });
  };

  // Function to update a booking
  const updateBooking = async (bookingData: Booking) => {
    return new Promise<void>((resolve) => {
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingData.id ? bookingData : booking
        )
      );
      
      // Simulate API delay
      setTimeout(() => {
        resolve();
      }, 500);
    });
  };

  // Function to apply delay to bookings after a certain time
  const applyDelay = async (delayMinutes: number, startDateTime: Date) => {
    return new Promise<void>((resolve) => {
      const startTime = startDateTime.getTime();
      
      setBookings(prevBookings =>
        prevBookings.map(booking => {
          const bookingStart = new Date(booking.start).getTime();
          
          // Only delay bookings that start after the specified time
          if (bookingStart >= startTime) {
            const newStart = new Date(bookingStart + delayMinutes * 60 * 1000).toISOString();
            const newEnd = new Date(new Date(booking.end).getTime() + delayMinutes * 60 * 1000).toISOString();
            
            return {
              ...booking,
              start: newStart,
              end: newEnd,
            };
          }
          
          return booking;
        })
      );
      
      // Simulate API delay
      setTimeout(() => {
        resolve();
      }, 500);
    });
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
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => useContext(BookingContext);
