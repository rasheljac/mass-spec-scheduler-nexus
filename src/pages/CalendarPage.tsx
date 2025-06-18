
import React from "react";
import CalendarView from "../components/calendar/CalendarView";
import { useOptimizedBooking } from "../contexts/OptimizedBookingContext";
import { Loader2 } from "lucide-react";

const CalendarPage: React.FC = () => {
  const { isLoading } = useOptimizedBooking();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
        <span className="ml-2 text-lg text-mslab-400">Loading calendar...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Booking Calendar</h1>
      <CalendarView />
    </div>
  );
};

export default CalendarPage;
