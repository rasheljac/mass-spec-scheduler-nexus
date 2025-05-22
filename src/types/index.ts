
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
};

export type Booking = {
  id: string;
  userId: string;
  userName: string;
  instrumentId: string;
  instrumentName: string;
  start: Date | string;
  end: Date | string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  title?: string;
  description?: string;
  createdAt: Date | string;
};

export type BookingFormData = {
  instrumentId: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
};
