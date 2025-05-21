
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { useBooking } from "../../contexts/BookingContext";
import { useAuth } from "../../contexts/AuthContext";
import { Booking } from "../../types";

interface EditBookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}

const formSchema = z.object({
  date: z.date({ required_error: "Please select a date" }),
  startTime: z.string({ required_error: "Please select a start time" }),
  endTime: z.string({ required_error: "Please select an end time" }),
  purpose: z.string().min(5, { message: "Purpose must be at least 5 characters" }),
  details: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditBookingForm: React.FC<EditBookingFormProps> = ({ open, onOpenChange, booking }) => {
  const { instruments, updateBooking } = useBooking();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Generate time options in 30-minute increments
  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const ampm = hour < 12 ? "AM" : "PM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute} ${ampm}`;
  });

  const formatDateToTimeString = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const minuteStr = minutes === 0 ? "00" : "30";
    return `${hour12}:${minuteStr} ${ampm}`;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: booking ? new Date(booking.start) : new Date(),
      startTime: booking ? formatDateToTimeString(booking.start) : "9:00 AM",
      endTime: booking ? formatDateToTimeString(booking.end) : "10:00 AM",
      purpose: booking?.purpose || "",
      details: booking?.details || "",
    },
  });

  // Update form when booking changes
  useEffect(() => {
    if (booking) {
      form.setValue("date", new Date(booking.start));
      form.setValue("startTime", formatDateToTimeString(booking.start));
      form.setValue("endTime", formatDateToTimeString(booking.end));
      form.setValue("purpose", booking.purpose);
      form.setValue("details", booking.details || "");
    }
  }, [booking, form]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !booking) {
      toast({
        title: "Error",
        description: "Missing user or booking information",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Parse times
      const parseTime = (dateStr: Date, timeStr: string) => {
        const [timePart, ampm] = timeStr.split(" ");
        const [hourStr, minuteStr] = timePart.split(":");
        let hour = parseInt(hourStr, 10);
        const minute = parseInt(minuteStr, 10);
        
        // Convert to 24-hour format
        if (ampm === "PM" && hour !== 12) {
          hour += 12;
        } else if (ampm === "AM" && hour === 12) {
          hour = 0;
        }
        
        const result = new Date(dateStr);
        result.setHours(hour, minute, 0, 0);
        return result;
      };

      const start = parseTime(values.date, values.startTime);
      const end = parseTime(values.date, values.endTime);

      // Validate that end time is after start time
      if (end <= start) {
        toast({
          title: "Invalid time selection",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      await updateBooking({
        ...booking,
        start: start.toISOString(),
        end: end.toISOString(),
        purpose: values.purpose,
        details: values.details || undefined
      });

      toast({
        title: "Booking updated",
        description: `You've updated booking for ${booking.instrumentName} on ${format(values.date, "MMMM d, yyyy")}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canEdit = () => {
    if (!booking || !user) return false;
    return user.role === "admin" || booking.userId === user.id;
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <h3 className="font-medium">Instrument:</h3>
              <p>{booking.instrumentName}</p>
            </div>
            
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => date && field.onChange(date)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map(time => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Briefly describe what you'll be using the instrument for"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This helps lab managers prioritize requests if needed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details about your booking"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !canEdit()}
              >
                {isLoading ? "Updating..." : "Update Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingForm;
