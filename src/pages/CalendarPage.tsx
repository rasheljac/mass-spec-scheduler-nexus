
import React from "react";
import CalendarView from "../components/calendar/CalendarView";

const CalendarPage: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Booking Calendar</h1>
      <CalendarView />
    </div>
  );
};

export default CalendarPage;
