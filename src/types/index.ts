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
}

export interface Instrument {
  id: string;
  name: string;
  description: string;
  status: 'available' | 'in_use' | 'maintenance';
  location: string;
  specifications: string;
  image: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}
