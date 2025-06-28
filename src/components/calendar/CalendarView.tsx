import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isToday, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { useOptimizedBooking } from "../../contexts/OptimizedBookingContext";
import { Booking } from "../../types";
import BookingForm from "./BookingForm";
import EditBookingForm from "./EditBookingForm";
import StatusBadge from "./StatusBadge";
import InstrumentFilter from "./InstrumentFilter";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

type ViewMode = "day" | "week" | "month";

const CalendarView: React.FC = () => {
  const { bookings, instruments, updateBooking, getStatusColor } = useOptimizedBooking();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedInstrument, setSelectedInstrument] = useState<string>("all");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Memoized filtered bookings
  const visibleBookings = useMemo(() => {
    let filteredBookings = bookings.filter(b => b.status !== "cancelled");

    if (selectedInstrument !== "all") {
      filteredBookings = filteredBookings.filter(booking => 
        booking.instrumentId === selectedInstrument
      );
    }

    if (viewMode === "day") {
      return filteredBookings.filter(booking => {
        const bookingDate = parseISO(typeof booking.start === 'string' ? booking.start : booking.start.toISOString());
        return isSameDay(bookingDate, selectedDate);
      });
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      
      return filteredBookings.filter(booking => {
        const bookingDate = parseISO(typeof booking.start === 'string' ? booking.start : booking.start.toISOString());
        return bookingDate >= weekStart && bookingDate <= weekEnd;
      });
    } else if (viewMode === "month") {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      
      return filteredBookings.filter(booking => {
        const bookingDate = parseISO(typeof booking.start === 'string' ? booking.start : booking.start.toISOString());
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });
    }
    return filteredBookings;
  }, [bookings, selectedInstrument, viewMode, selectedDate]);

  // Format time for display
  const formatTime = useCallback((dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, "h:mm a");
  }, []);

  // Format date range for display
  const formatDateRange = useCallback((start: string | Date, end: string | Date) => {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;
    
    if (isSameDay(startDate, endDate)) {
      return `${formatTime(start)} - ${formatTime(end)}`;
    } else {
      return `${format(startDate, "MMM d")} ${formatTime(startDate)} - ${format(endDate, "MMM d")} ${formatTime(end)}`;
    }
  }, [formatTime]);

  const handleEditBooking = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  }, []);

  // Check if user can edit a booking
  const canEditBooking = useCallback((booking: Booking) => {
    if (!user) return false;
    return user.role === "admin" || booking.userId === user.id;
  }, [user]);

  const handleUpdateBooking = useCallback(async (bookingData: Partial<Booking>) => {
    if (selectedBooking && bookingData) {
      try {
        await updateBooking({
          ...selectedBooking,
          ...bookingData
        });
        toast.success("Booking updated successfully");
        setIsEditModalOpen(false);
        setSelectedBooking(null);
      } catch (error) {
        console.error("Error updating booking:", error);
        toast.error("Failed to update booking");
      }
    }
  }, [selectedBooking, updateBooking]);

  // Memoized range calculations
  const weekRange = useMemo(() => ({
    start: startOfWeek(selectedDate, { weekStartsOn: 0 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 0 })
  }), [selectedDate]);

  const monthRange = useMemo(() => ({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  }), [selectedDate]);

  // Navigation functions
  const moveToday = useCallback(() => setSelectedDate(new Date()), []);
  const moveNext = useCallback(() => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, 1));
    } else if (viewMode === "week") {
      setSelectedDate(addWeeks(selectedDate, 1));
    } else if (viewMode === "month") {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  }, [viewMode, selectedDate]);
  
  const movePrevious = useCallback(() => {
    if (viewMode === "day") {
      setSelectedDate(addDays(selectedDate, -1));
    } else if (viewMode === "week") {
      setSelectedDate(subWeeks(selectedDate, 1));
    } else if (viewMode === "month") {
      setSelectedDate(subMonths(selectedDate, 1));
    }
  }, [viewMode, selectedDate]);

  // Generate time slots for day view (9am to 5pm)
  const renderDayView = () => {
    const dayBookings = visibleBookings.sort((a, b) => 
      parseISO(typeof a.start === 'string' ? a.start : a.start.toISOString()).getTime() - 
      parseISO(typeof b.start === 'string' ? b.start : b.start.toISOString()).getTime()
    );

    return (
      <div className="space-y-4">
        <h2 className="font-medium text-lg text-center">
          {format(selectedDate, "EEEE, MMMM d")}
        </h2>
        {dayBookings.length > 0 ? (
          dayBookings.map(booking => (
            <Card key={booking.id} className="p-4 border-l-4" style={{ borderLeftColor: getStatusColor(booking.status) }}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{booking.instrumentName}</h3>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{booking.userName}</p>
                  <p className="text-sm">{formatDateRange(booking.start, booking.end)}</p>
                  {booking.details && <p className="text-sm mt-1">{booking.details}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm">{booking.purpose}</div>
                  {canEditBooking(booking) && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditBooking(booking)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
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
            const dayBookings = visibleBookings.filter(booking => {
              const bookingDate = parseISO(typeof booking.start === 'string' ? booking.start : booking.start.toISOString());
              return isSameDay(bookingDate, day);
            });
            
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
                      <Card key={booking.id} className="p-2 border-l-4" style={{ borderLeftColor: getStatusColor(booking.status) }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{booking.instrumentName}</h4>
                              <StatusBadge status={booking.status} />
                            </div>
                            <p className="text-xs text-muted-foreground">{formatDateRange(booking.start, booking.end)}</p>
                            {booking.details && <p className="text-xs mt-1">{booking.details}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm">{booking.userName}</div>
                            {canEditBooking(booking) && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditBooking(booking)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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

  // Generate month view
  const renderMonthView = () => {
    // Get all days in the current month
    const days = eachDayOfInterval({
      start: monthRange.start,
      end: monthRange.end
    });

    // Create calendar grid (6 weeks x 7 days)
    const startOfView = startOfWeek(monthRange.start, { weekStartsOn: 0 });
    const endOfView = endOfWeek(monthRange.end, { weekStartsOn: 0 });
    
    const calendarDays = eachDayOfInterval({
      start: startOfView,
      end: endOfView
    });

    // Group by weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    calendarDays.forEach((day) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return (
      <div className="space-y-4">
        <h2 className="font-medium text-lg text-center">
          {format(selectedDate, "MMMM yyyy")}
        </h2>
        
        <div className="border rounded-md overflow-hidden">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-accent/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="p-2 text-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="divide-y">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 divide-x">
                {week.map((day) => {
                  const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
                  const dayBookings = visibleBookings.filter(booking => {
                    const bookingDate = parseISO(typeof booking.start === 'string' ? booking.start : booking.start.toISOString());
                    return isSameDay(bookingDate, day);
                  });

                  return (
                    <div 
                      key={day.toString()}
                      className={cn(
                        "p-1 min-h-[100px] relative",
                        !isCurrentMonth && "bg-muted/20 text-muted-foreground",
                        isToday(day) && "bg-accent/40",
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-sm",
                        isToday(day) && "bg-primary text-primary-foreground"
                      )}>
                        {format(day, "d")}
                      </div>
                      
                      <div className="mt-6 space-y-1 text-xs">
                        {dayBookings.slice(0, 2).map((booking) => (
                          <div 
                            key={booking.id}
                            className="p-1 rounded truncate cursor-pointer flex items-center justify-between"
                            style={{ backgroundColor: `${getStatusColor(booking.status)}20`, borderLeft: `3px solid ${getStatusColor(booking.status)}` }}
                            onClick={() => handleEditBooking(booking)}
                            title={`${booking.instrumentName} - ${booking.userName} - ${booking.status}`}
                          >
                            <span className="truncate">
                              {formatTime(booking.start)} {booking.instrumentName}
                            </span>
                            <StatusBadge status={booking.status} className="ml-1 text-[10px] px-1" />
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayBookings.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
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

          <InstrumentFilter
            instruments={instruments}
            selectedInstrument={selectedInstrument}
            onInstrumentChange={setSelectedInstrument}
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white border rounded-md inline-flex">
            <Button
              variant={viewMode === "day" ? "default" : "ghost"}
              size="sm"
              className="rounded-r-none rounded-l-md"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              className="rounded-l-none rounded-r-md"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>

          <Button onClick={() => setIsBookingModalOpen(true)}>
            New Booking
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {viewMode === "day" 
          ? renderDayView() 
          : viewMode === "week" 
          ? renderWeekView()
          : renderMonthView()}
      </div>

      <BookingForm
        open={isBookingModalOpen} 
        onOpenChange={setIsBookingModalOpen}
        selectedDate={selectedDate}
      />

      {selectedBooking && (
        <EditBookingForm
          open={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen}
          booking={selectedBooking}
          onSubmit={handleUpdateBooking}
        />
      )}
    </div>
  );
};

export default CalendarView;
