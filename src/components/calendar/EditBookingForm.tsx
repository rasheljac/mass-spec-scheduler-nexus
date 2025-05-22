
import React, { useState, useEffect } from "react";
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
import { CalendarIcon, MessageSquare, Trash2 } from "lucide-react";
import { format, addHours, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Booking, Comment } from "../../types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { v4 as uuidv4 } from 'uuid';
import { useBooking } from "../../contexts/BookingContext";
import { toast } from "../ui/sonner";

const formSchema = z.object({
  instrumentId: z.string(),
  instrumentName: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  purpose: z.string().min(2, {
    message: "Purpose must be at least 2 characters.",
  }),
  details: z.string().optional(),
  status: z.enum(["Not-Started", "In-Progress", "Completed", "Delayed", "confirmed", "pending", "cancelled"]),
  newComment: z.string().optional(),
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
  const { user } = useAuth();
  const { deleteCommentFromBooking } = useBooking();
  const [comments, setComments] = useState<Comment[]>([]);
  const [formInitialized, setFormInitialized] = useState(false);
  
  // Initialize form when booking changes
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instrumentId: "",
      instrumentName: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "12:00 PM",
      endTime: "1:00 PM",
      purpose: "",
      details: "",
      status: "pending" as const,
      newComment: "",
    },
  });
  
  // Effect to initialize form values when booking changes
  useEffect(() => {
    if (booking && user) {
      console.log("Initializing form with booking:", booking);
      
      // Convert "completed" to "Completed" if needed
      const normalizeStatus = (status: string) => {
        if (status === "completed") return "Completed";
        return status;
      };

      // Parse the date and time
      const parseDateTime = (dateTimeStr: string | Date) => {
        const dateTime = new Date(dateTimeStr);
        return {
          date: dateTime,
          time: format(dateTime, "h:mm a")
        };
      };

      const startDateTime = parseDateTime(booking.start);
      const endDateTime = parseDateTime(booking.end);
      
      form.reset({
        instrumentId: booking?.instrumentId || "",
        instrumentName: booking?.instrumentName || "",
        startDate: startDateTime.date,
        endDate: endDateTime.date,
        startTime: startDateTime.time,
        endTime: endDateTime.time,
        purpose: booking?.purpose || "",
        details: booking?.details || "",
        status: normalizeStatus(booking?.status || "pending") as any,
        newComment: "",
      });
      
      setComments(booking.comments || []);
      setFormInitialized(true);
    }
  }, [booking, user, form]);
  
  // Return null until we have both booking and user data
  if (!booking || !user) {
    console.log("Missing booking or user data for EditBookingForm");
    return null;
  }

  // Generate time options in 30-minute increments
  const timeOptions = Array.from({ length: 24 * 2 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const ampm = hour < 12 ? "AM" : "PM";
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${minute} ${ampm}`;
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (onSubmit) {
      const parseTime = (date: Date, timeStr: string) => {
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
        
        const result = new Date(date);
        result.setHours(hour, minute, 0, 0);
        return result;
      };

      const start = parseTime(values.startDate, values.startTime);
      const end = parseTime(values.endDate, values.endTime);

      // Filter out the empty comment if there is one
      const newComment = values.newComment?.trim();
      let updatedComments = [...comments];
      
      if (newComment) {
        updatedComments.push({
          id: uuidv4(),
          userId: user.id,
          userName: user.name,
          content: newComment,
          createdAt: new Date().toISOString()
        });
      }

      onSubmit({
        ...booking,
        instrumentId: values.instrumentId,
        instrumentName: values.instrumentName,
        start: start.toISOString(),
        end: end.toISOString(),
        purpose: values.purpose,
        details: values.details,
        status: values.status,
        comments: updatedComments
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

  const addComment = (comment: string) => {
    if (!comment.trim()) return;

    const newComment: Comment = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      content: comment.trim(),
      createdAt: new Date().toISOString()
    };

    setComments([...comments, newComment]);
    form.setValue("newComment", "");
  };
  
  const handleDeleteComment = async (commentId: string) => {
    try {
      // First update the local state for immediate visual feedback
      setComments(currentComments => currentComments.filter(comment => comment.id !== commentId));
      
      // Then update in the context (which will update localStorage)
      if (booking) {
        await deleteCommentFromBooking(booking.id, commentId);
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };
  
  // Helper function to check if user can delete a comment
  const canDeleteComment = (comment: Comment) => {
    return user.role === "admin" || comment.userId === user.id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking</DialogTitle>
        </DialogHeader>
        {formInitialized && (
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
                <div>
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>Start Date</FormLabel>
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
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                }
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map(time => (
                              <SelectItem key={`start-${time}`} value={time}>
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
                
                <div>
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="mb-4">
                        <FormLabel>End Date</FormLabel>
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
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date);
                                }
                              }}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map(time => (
                              <SelectItem key={`end-${time}`} value={time}>
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

              <div className="pt-4">
                <h3 className="text-lg font-medium flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Comments
                </h3>
                <Card className="mb-4">
                  <CardContent className="pt-4">
                    {(comments && comments.length > 0) ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar>
                              <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{comment.userName}</h4>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                                  </span>
                                </div>
                                {canDeleteComment(comment) && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm mt-1">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm text-center py-4">No comments yet</p>
                    )}

                    <Separator className="my-4" />
                    
                    <FormField
                      control={form.control}
                      name="newComment"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Textarea 
                                placeholder="Add a comment..." 
                                className="min-h-[60px] flex-1"
                                {...field}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditBookingForm;
