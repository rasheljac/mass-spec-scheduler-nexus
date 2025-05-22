
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, addHours } from "date-fns";
import { cn } from "@/lib/utils";
import { Booking } from "../../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const formSchema = z.object({
  instrumentId: z.string(),
  instrumentName: z.string(),
  start: z.date(),
  end: z.date(),
  purpose: z.string().min(2, {
    message: "Purpose must be at least 2 characters.",
  }),
  details: z.string().optional(),
  status: z.enum(["Not-Started", "In-Progress", "Completed", "Delayed", "confirmed", "pending", "cancelled"]),
});

interface EditBookingFormProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: Partial<Booking>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const EditBookingForm: React.FC<EditBookingFormProps> = ({
  booking,
  open,
  onOpenChange,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  if (!booking) return null;

  // Convert "completed" to "Completed" if needed
  const normalizeStatus = (status: string) => {
    if (status === "completed") return "Completed";
    return status;
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instrumentId: booking.instrumentId,
      instrumentName: booking.instrumentName,
      start: new Date(booking.start),
      end: new Date(booking.end),
      purpose: booking.purpose || "",
      details: booking.details || "",
      status: normalizeStatus(booking.status) as any,
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (onSubmit) {
      onSubmit({
        ...values,
        start: values.start.toISOString(),
        end: values.end.toISOString(),
      });
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="instrumentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrument</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date & Time</FormLabel>
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
                              format(field.value, "PPP HH:mm")
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
                          onSelect={(date) => {
                            if (date) {
                              const currentDate = field.value;
                              date.setHours(currentDate.getHours());
                              date.setMinutes(currentDate.getMinutes());
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={format(field.value, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const newDate = new Date(field.value);
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              field.onChange(newDate);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date & Time</FormLabel>
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
                              format(field.value, "PPP HH:mm")
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
                          onSelect={(date) => {
                            if (date) {
                              const currentDate = field.value;
                              date.setHours(currentDate.getHours());
                              date.setMinutes(currentDate.getMinutes());
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={format(field.value, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const newDate = new Date(field.value);
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              field.onChange(newDate);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Not-Started">Not Started</SelectItem>
                      <SelectItem value="In-Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Delayed">Delayed</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingForm;
