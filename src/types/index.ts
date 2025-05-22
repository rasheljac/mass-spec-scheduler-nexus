
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  department?: string;
  password?: string;
};

export type Instrument = {
  id: string;
  name: string;
  type: string;
  status: "available" | "in-use" | "maintenance" | "offline";
  location: string;
  description?: string;
  image?: string;
  model?: string; // Added model property
  calibrationDue?: string; // Added calibrationDue property
  maintenanceHistory?: Array<{date: string, description: string}>; // Added maintenanceHistory
};

export type Booking = {
  id: string;
  userId: string;
  userName: string;
  instrumentId: string;
  instrumentName: string;
  start: Date | string;
  end: Date | string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "Not-Started" | "In-Progress" | "Completed" | "Delayed";
  title?: string;
  description?: string;
  purpose?: string; // Added purpose property
  details?: string; // Added details property
  createdAt: Date | string;
};

export type BookingFormData = {
  instrumentId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
};

// Added BookingStatistics type
export type BookingStatistics = {
  totalBookings: number;
  instrumentUsage: Array<{
    instrumentId: string;
    instrumentName: string;
    bookingCount: number;
    totalHours: number;
  }>;
  userBookings: Array<{
    userId: string;
    userName: string;
    bookingCount: number;
    totalHours: number;
  }>;
  weeklyUsage: Array<{
    week: string;
    bookingCount: number;
  }>;
};
