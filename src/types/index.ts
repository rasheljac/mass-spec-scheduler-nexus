
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'user';
  department?: string;
  profileImage?: string | null;
}

export interface Booking {
  id: string;
  instrumentId: string;
  instrumentName: string;
  start: string;
  end: string;
  purpose: string;
  details?: string;
  status: string;
  userId: string;
  userName: string;
  comments: Comment[];
  createdAt?: string;
}

export interface Instrument {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  location: string;
  specifications: string;
  image: string;
  type?: string;
  model?: string;
  calibrationDue?: string;
  maintenanceHistory?: Array<{ date: string; description: string }>;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface BookingStatistics {
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
}
