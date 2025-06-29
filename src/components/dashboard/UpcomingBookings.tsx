
import React, { useEffect } from "react";
import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useOptimizedBooking } from "../../contexts/OptimizedBookingContext";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

const UpcomingBookings: React.FC = () => {
  const { bookings, isLoading, refreshData } = useOptimizedBooking();
  const { user } = useAuth();

  // Refresh data when component mounts if no bookings are loaded
  useEffect(() => {
    if (!isLoading && bookings.length === 0) {
      console.log("No bookings loaded, refreshing data...");
      refreshData();
    }
  }, [bookings.length, isLoading, refreshData]);

  console.log("UpcomingBookings - Total bookings:", bookings.length);
  console.log("UpcomingBookings - Current user:", user?.id, user?.role);
  console.log("UpcomingBookings - Loading state:", isLoading);

  // Get the next 5 bookings for the current user or all bookings if admin
  const now = new Date();
  const today = startOfDay(now);
  
  const upcoming = bookings
    .filter(booking => {
      const bookingEnd = new Date(booking.end);
      
      // Include bookings that haven't ended yet (including ongoing ones)
      const isNotEnded = bookingEnd >= now; // Changed from today to now for more accurate filtering
      const isConfirmed = booking.status === "confirmed";
      const isUserBooking = user?.role === "admin" || booking.userId === user?.id;
      
      return isNotEnded && isConfirmed && isUserBooking;
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
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading bookings...</span>
          </div>
        ) : upcoming.length > 0 ? (
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
              {bookings.length === 0 ? "No bookings found" : `Found ${bookings.length} total bookings`}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingBookings;
