
import React, { useState } from "react";
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { useBooking } from "../../contexts/BookingContext";
import { Booking } from "../../types";
import BookingForm from "./BookingForm";

type ViewMode = "day" | "week" | "month";

const CalendarView: React.FC = () => {
  const { bookings } = useBooking();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Helper to get the week range displayed
  const weekRange = {
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),  // Sunday
    end: endOfWeek(selectedDate, { weekStartsOn: 0 })       // Saturday
  };

  // Get bookings for the current view (day or week)
  const getVisibleBookings = (): Booking[] => {
    if (viewMode === "day") {
      return bookings.filter(booking => 
        isSameDay(new Date(booking.start), selectedDate) && booking.status !== "cancelled"
      );
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.start);
        return bookingDate >= weekStart && bookingDate <= weekEnd && booking.status !== "cancelled";
      });
    }
    // Month view will need further implementation
    return bookings.filter(b => b.status !== "cancelled");
  };

  const visibleBookings = getVisibleBookings();

  // Navigation functions
  const moveToday = () => setSelectedDate(new Date());
  const moveNext = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === "week") {
      setSelectedDate(addWeeks(selectedDate, 1));
    }
    // Add month navigation later
  };
  const movePrevious = () => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, -1));
    } else if (viewMode === "week") {
      setSelectedDate(subWeeks(selectedDate, 1));
    }
    // Add month navigation later
  };

  // Format time for display
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, "h:mm a");
  };

  // Generate time slots for day view (9am to 5pm)
  const renderDayView = () => {
    const dayBookings = visibleBookings.sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    return (
      <div className="space-y-4">
        <h2 className="font-medium text-lg text-center">
          {format(selectedDate, "EEEE, MMMM d")}
        </h2>
        {dayBookings.length > 0 ? (
          dayBookings.map(booking => (
            <Card key={booking.id} className="p-4 border-l-4 border-l-mslab-400">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{booking.instrumentName}</h3>
                  <p className="text-sm text-muted-foreground">{booking.userName}</p>
                  <p className="text-sm">{formatTime(booking.start)} - {formatTime(booking.end)}</p>
                </div>
                <div className="text-sm">{booking.purpose}</div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground">No bookings for this day</p>
        )}
      </div>
    );
  };

  // Generate week view
  const renderWeekView = () => {
    // Create an array of days for the current week
    const days = [];
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      days.push(day);
    }

    return (
      <div className="space-y-4">
        <h2 className="font-medium text-lg text-center">
          {format(weekRange.start, "MMM d")} - {format(weekRange.end, "MMM d, yyyy")}
        </h2>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <div
              key={day.toString()}
              className={cn(
                "p-1 text-center border-t",
                isToday(day) && "bg-accent"
              )}
            >
              <div className="font-medium text-xs mb-1">{format(day, "EEE")}</div>
              <div className={cn(
                "aspect-square flex items-center justify-center rounded-full w-7 h-7 mx-auto",
                isToday(day) && "bg-primary text-primary-foreground"
              )}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        
        <div className="space-y-2">
          {days.map((day) => {
            const dayBookings = bookings.filter(
              booking => isSameDay(new Date(booking.start), day) && booking.status !== "cancelled"
            );
            
            return (
              <div key={day.toString()} className="border-t pt-2">
                <h3 className={cn(
                  "font-medium mb-2",
                  isToday(day) && "text-primary"
                )}>
                  {format(day, "EEEE, MMM d")}
                </h3>
                
                {dayBookings.length > 0 ? (
                  <div className="space-y-2">
                    {dayBookings.map(booking => (
                      <Card key={booking.id} className="p-2 border-l-4 border-l-mslab-400">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{booking.instrumentName}</h4>
                            <p className="text-xs text-muted-foreground">{formatTime(booking.start)} - {formatTime(booking.end)}</p>
                          </div>
                          <div className="text-sm">{booking.userName}</div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No bookings</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={movePrevious}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={moveToday}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={moveNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span>Date</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white border rounded-md inline-flex">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
          </div>

          <Button onClick={() => setIsBookingModalOpen(true)}>
            New Booking
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {viewMode === "day" ? renderDayView() : renderWeekView()}
      </div>

      <BookingForm
        open={isBookingModalOpen} 
        onOpenChange={setIsBookingModalOpen}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default CalendarView;
