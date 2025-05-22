
import React from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useBooking } from "../../contexts/BookingContext";
import { useAuth } from "../../contexts/AuthContext";

const UpcomingBookings: React.FC = () => {
  const { bookings } = useBooking();
  const { user } = useAuth();

  // Get the next 5 bookings for the current user or all bookings if admin
  const upcoming = bookings
    .filter(booking => 
      new Date(booking.start) >= new Date() && 
      booking.status === "confirmed" &&
      (user?.role === "admin" || booking.userId === user?.id)
    )
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  // Format the date string nicely
  const formatDateDisplay = (dateStr: string | Date): string => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d 'at' h:mm a");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Upcoming Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((booking) => (
              <div key={booking.id} className="flex flex-col border-b pb-2">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{booking.instrumentName}</p>
                  <span className="text-sm text-muted-foreground">
                    {formatDateDisplay(booking.start)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Booked by: {booking.userName}
                </p>
                <p className="text-sm">{booking.purpose || booking.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No upcoming bookings</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingBookings;
