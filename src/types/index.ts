
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

export interface Instrument {
  id: string;
  name: string;
  model: string;
  location: string;
  status: "available" | "maintenance" | "in-use";
  image?: string;
  description?: string;
  calibrationDue?: string;
  maintenanceHistory?: {
    date: string;
    description: string;
  }[];
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  instrumentId: string;
  instrumentName: string;
  start: string;
  end: string;
  purpose: string;
  status: "Not-Started" | "In-Progress" | "Completed" | "Delayed" | "confirmed" | "pending" | "cancelled";
  createdAt: string;
  details?: string;
}

export interface BookingStatistics {
  totalBookings: number;
  instrumentUsage: {
    instrumentId: string;
    instrumentName: string;
    bookingCount: number;
    totalHours: number;
  }[];
  userBookings: {
    userId: string;
    userName: string;
    bookingCount: number;
    totalHours: number;
  }[];
  weeklyUsage: {
    week: string;
    bookingCount: number;
  }[];
}
