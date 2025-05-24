
import React from "react";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useBooking } from "../../contexts/BookingContext";
import { useAuth } from "../../contexts/AuthContext";

const UpcomingBookings: React.FC = () => {
  const { bookings } = useBooking();
  const { user } = useAuth();

  console.log("UpcomingBookings - Total bookings:", bookings.length);
  console.log("UpcomingBookings - Current user:", user?.id, user?.role);
  console.log("UpcomingBookings - All bookings:", bookings);

  // Get the next 5 bookings for the current user or all bookings if admin
  const now = new Date();
  const today = startOfDay(now);
  
  console.log("UpcomingBookings - Current time:", now.toISOString());
  console.log("UpcomingBookings - Today start:", today.toISOString());

  const upcoming = bookings
    .filter(booking => {
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      
      console.log(`UpcomingBookings - Checking booking ${booking.id}:`);
      console.log(`  - Start: ${bookingStart.toISOString()}`);
      console.log(`  - End: ${bookingEnd.toISOString()}`);
      console.log(`  - Status: ${booking.status}`);
      console.log(`  - User: ${booking.userId} (current: ${user?.id})`);
      console.log(`  - Is future or today: ${bookingEnd >= today}`);
      console.log(`  - Is confirmed: ${booking.status === "confirmed"}`);
      console.log(`  - User match: ${user?.role === "admin" || booking.userId === user?.id}`);
      
      // Include bookings that haven't ended yet (including ongoing ones)
      const isNotEnded = bookingEnd >= today;
      const isConfirmed = booking.status === "confirmed";
      const isUserBooking = user?.role === "admin" || booking.userId === user?.id;
      
      const shouldInclude = isNotEnded && isConfirmed && isUserBooking;
      console.log(`  - Should include: ${shouldInclude}`);
      
      return shouldInclude;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  console.log("UpcomingBookings - Filtered upcoming bookings:", upcoming);

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
                <p className="text-sm">{booking.purpose || booking.details}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            <p>No upcoming bookings</p>
            <p className="text-xs mt-1">
              Debug: Found {bookings.length} total bookings, user role: {user?.role}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingBookings;
