import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addHours, setHours, setMinutes, addMinutes } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
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
import { Switch } from "../ui/switch";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

const formSchema = z.object({
  instrumentId: z.string({ required_error: "Please select an instrument" }),
  date: z.date({ required_error: "Please select a date" }),
  startTime: z.string({ required_error: "Please select a start time" }),
  endTime: z.string({ required_error: "Please select an end time" }),
  purpose: z.string().min(5, { message: "Purpose must be at least 5 characters" }),
  useAutoDuration: z.boolean().default(false),
  sampleCount: z.coerce.number().int().min(1).optional(),
  timePerSample: z.coerce.number().int().min(1).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const BookingForm: React.FC<BookingFormProps> = ({ open, onOpenChange, selectedDate }) => {
  const { instruments, createBooking } = useBooking();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [useAutoDuration, setUseAutoDuration] = useState(false);

  // Generate time options in 30-minute increments
  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const ampm = hour < 12 ? "AM" : "PM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute} ${ampm}`;
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instrumentId: "",
      date: selectedDate || new Date(),
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      purpose: "",
      useAutoDuration: false,
      sampleCount: 1,
      timePerSample: 30,
    },
  });

  // Reset form when selected date changes
  React.useEffect(() => {
    if (selectedDate) {
      form.setValue("date", selectedDate);
    }
  }, [selectedDate, form]);

  // Auto-calculate end time when relevant fields change
  useEffect(() => {
    const autoDuration = form.watch("useAutoDuration");
    const sampleCount = form.watch("sampleCount");
    const timePerSample = form.watch("timePerSample");
    const startTime = form.watch("startTime");
    
    if (autoDuration && sampleCount && timePerSample && startTime) {
      // Parse the start time
      const parseTime = (timeStr: string) => {
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
        
        return { hour, minute };
      };

      // Format time to options format
      const formatTimeOption = (date: Date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? "PM" : "AM";
        
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
        
        return `${hours}:${minutesStr} ${ampm}`;
      };

      try {
        const { hour, minute } = parseTime(startTime);
        const totalMinutes = Number(sampleCount) * Number(timePerSample);
        
        // Create a date with the start time and add the calculated duration
        const startDate = new Date(form.getValues("date"));
        startDate.setHours(hour, minute, 0, 0);
        const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
        
        // Find the closest 30-minute time slot
        const roundedMinutes = Math.ceil(endDate.getMinutes() / 30) * 30;
        endDate.setMinutes(roundedMinutes % 60);
        if (roundedMinutes >= 60) {
          endDate.setHours(endDate.getHours() + Math.floor(roundedMinutes / 60));
        }
        
        // Format and set the end time
        const endTimeStr = formatTimeOption(endDate);
        if (timeOptions.includes(endTimeStr)) {
          form.setValue("endTime", endTimeStr);
        }
      } catch (e) {
        console.error("Error calculating end time:", e);
      }
    }
  }, [
    form.watch("useAutoDuration"),
    form.watch("sampleCount"),
    form.watch("timePerSample"),
    form.watch("startTime"),
    form.watch("date")
  ]);

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book an instrument",
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

      const selectedInstrument = instruments.find(i => i.id === values.instrumentId);
      if (!selectedInstrument) {
        toast({
          title: "Error",
          description: "Selected instrument not found",
          variant: "destructive",
        });
        return;
      }

      await createBooking({
        userId: user.id,
        userName: user.name,
        instrumentId: values.instrumentId,
        instrumentName: selectedInstrument.name,
        start: start.toISOString(),
        end: end.toISOString(),
        purpose: values.purpose,
        details: values.purpose, // Add description field to match the type
        status: "confirmed"
      });

      toast({
        title: "Booking successful",
        description: `You've booked ${selectedInstrument.name} on ${format(values.date, "MMMM d, yyyy")}`,
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Instrument Time</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="instrumentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrument</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {instruments
                        .filter(i => i.status === "available")
                        .map(instrument => (
                          <SelectItem key={instrument.id} value={instrument.id}>
                            {instrument.name} - {instrument.location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the instrument you want to use
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      disabled={form.watch("useAutoDuration")}
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
              name="useAutoDuration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-calculate duration</FormLabel>
                    <FormDescription>
                      Calculate end time based on sample quantity and time per sample
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {form.watch("useAutoDuration") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sampleCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sample Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>Number of samples to process</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timePerSample"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minutes Per Sample</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>Average time to process each sample</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
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
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Booking..." : "Book Instrument"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm;
