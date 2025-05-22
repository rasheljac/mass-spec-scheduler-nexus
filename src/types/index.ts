
export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  department?: string;
  password?: string;
  profileImage?: string;
};

export type Instrument = {
  id: string;
  name: string;
  type: string;
  status: "available" | "in-use" | "maintenance" | "offline";
  location: string;
  description?: string;
  image?: string;
  model?: string;
  calibrationDue?: string;
  maintenanceHistory?: Array<{date: string, description: string}>;
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
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
  purpose?: string;
  details?: string;
  createdAt: Date | string;
  comments?: Comment[];
};

export type BookingFormData = {
  instrumentId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
};

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
