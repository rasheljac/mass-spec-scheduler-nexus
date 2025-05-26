
import React, { useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBooking } from "../contexts/BookingContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Calendar, Clock, MapPin, FileText, MessageCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const { bookings, isLoading, addCommentToBooking } = useBooking();
  const [commentContent, setCommentContent] = useState<{ [key: string]: string }>({});
  const [addingComment, setAddingComment] = useState<{ [key: string]: boolean }>({});

  // Filter bookings for the current user
  const userBookings = useMemo(() => {
    if (!user) return [];
    return bookings.filter(booking => booking.userId === user.id);
  }, [bookings, user]);

  // Categorize bookings
  const categorizedBookings = useMemo(() => {
    const now = new Date();
    
    const upcoming = userBookings.filter(booking => {
      const startTime = new Date(booking.start);
      return startTime > now && booking.status !== "Completed" && booking.status !== "cancelled";
    });

    const current = userBookings.filter(booking => {
      const startTime = new Date(booking.start);
      const endTime = new Date(booking.end);
      return startTime <= now && endTime >= now && booking.status === "In-Progress";
    });

    const past = userBookings.filter(booking => {
      const endTime = new Date(booking.end);
      return endTime < now || booking.status === "Completed" || booking.status === "cancelled";
    });

    return { upcoming, current, past };
  }, [userBookings]);

  const handleAddComment = async (bookingId: string) => {
    const content = commentContent[bookingId]?.trim();
    if (!content || !user) return;

    setAddingComment(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      await addCommentToBooking(bookingId, {
        userId: user.id,
        userName: user.name,
        content,
        createdAt: new Date().toISOString()
      });
      
      setCommentContent(prev => ({ ...prev, [bookingId]: "" }));
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setAddingComment(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "In-Progress":
        return "secondary";
      case "Completed":
        return "outline";
      case "cancelled":
        return "destructive";
      case "Delayed":
        return "secondary";
      default:
        return "outline";
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{booking.instrumentName}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(booking.start), "PPP")}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {format(new Date(booking.start), "p")} - {format(new Date(booking.end), "p")}
        </div>
        
        {booking.purpose && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-4 w-4 mt-0.5" />
            <span><strong>Purpose:</strong> {booking.purpose}</span>
          </div>
        )}
        
        {booking.details && (
          <div className="text-sm">
            <strong>Details:</strong> {booking.details}
          </div>
        )}

        {/* Comments section */}
        {booking.comments && booking.comments.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              Comments ({booking.comments.length})
            </h4>
            <div className="space-y-2">
              {booking.comments.map((comment: any) => (
                <div key={comment.id} className="bg-muted p-2 rounded text-sm">
                  <div className="font-medium">{comment.userName}</div>
                  <div className="text-muted-foreground">{comment.content}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(comment.createdAt), "PPp")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add comment section for active bookings */}
        {(booking.status === "confirmed" || booking.status === "In-Progress") && (
          <div className="border-t pt-3">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={commentContent[booking.id] || ""}
                onChange={(e) => setCommentContent(prev => ({ ...prev, [booking.id]: e.target.value }))}
                className="min-h-[60px]"
              />
              <Button
                size="sm"
                onClick={() => handleAddComment(booking.id)}
                disabled={!commentContent[booking.id]?.trim() || addingComment[booking.id]}
              >
                {addingComment[booking.id] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Comment"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your bookings</h1>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-mslab-400" />
        <span className="ml-2 text-lg text-mslab-400">Loading your bookings...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your laboratory instrument bookings
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({categorizedBookings.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="current">
            Current ({categorizedBookings.current.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({categorizedBookings.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {categorizedBookings.upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No upcoming bookings</h3>
                <p className="text-muted-foreground">
                  You don't have any upcoming instrument bookings scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            categorizedBookings.upcoming.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {categorizedBookings.current.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No current bookings</h3>
                <p className="text-muted-foreground">
                  You don't have any instruments currently in use.
                </p>
              </CardContent>
            </Card>
          ) : (
            categorizedBookings.current.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {categorizedBookings.past.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No past bookings</h3>
                <p className="text-muted-foreground">
                  Your completed bookings will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            categorizedBookings.past.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookingsPage;
