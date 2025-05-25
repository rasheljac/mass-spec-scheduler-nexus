
import React, { useState } from "react";
import { useBooking } from "../contexts/BookingContext";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Calendar, Clock, MapPin, User, FileText, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "../components/calendar/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

const MyBookingsPage: React.FC = () => {
  const { bookings, addCommentToBooking } = useBooking();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Filter bookings for the current user
  const userBookings = bookings.filter(booking => booking.userId === user?.id);

  // Categorize bookings
  const now = new Date();
  const upcomingBookings = userBookings.filter(booking => 
    new Date(booking.start) > now
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const currentBookings = userBookings.filter(booking => 
    new Date(booking.start) <= now && new Date(booking.end) >= now
  ).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const pastBookings = userBookings.filter(booking => 
    new Date(booking.end) < now
  ).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  const handleAddComment = async () => {
    if (!selectedBookingId || !newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      await addCommentToBooking(selectedBookingId, {
        userId: user!.id,
        userName: user!.name,
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      });
      
      setNewComment("");
      setSelectedBookingId(null);
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const renderBookingCard = (booking: any) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">
            {booking.instrumentName}
          </CardTitle>
          <StatusBadge status={booking.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(booking.start), "MMM dd, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(booking.start), "HH:mm")} - {format(new Date(booking.end), "HH:mm")}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Purpose:</span>
          <span>{booking.purpose}</span>
        </div>
        
        {booking.details && (
          <div className="text-sm">
            <span className="font-medium">Details:</span>
            <p className="mt-1 text-muted-foreground">{booking.details}</p>
          </div>
        )}
        
        {booking.comments && booking.comments.length > 0 && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Comments ({booking.comments.length})</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {booking.comments.map((comment: any) => (
                <div key={comment.id} className="text-xs bg-muted p-2 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">{comment.userName}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(comment.createdAt), "MMM dd, HH:mm")}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedBookingId(booking.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Comment to Booking</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="font-medium">{booking.instrumentName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.start), "MMM dd, yyyy HH:mm")} - {format(new Date(booking.end), "HH:mm")}
                  </p>
                </div>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setNewComment("");
                    setSelectedBookingId(null);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddComment}>
                    Add Comment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <div className="text-sm text-muted-foreground">
          Total bookings: {userBookings.length}
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming" className="relative">
            Upcoming
            {upcomingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {upcomingBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="current" className="relative">
            Current
            {currentBookings.length > 0 && (
              <Badge variant="default" className="ml-2 h-5 w-5 p-0 text-xs">
                {currentBookings.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="relative">
            Past
            {pastBookings.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 w-5 p-0 text-xs">
                {pastBookings.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming bookings</p>
                  <p className="text-sm">Your future reservations will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            upcomingBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="current" className="space-y-4">
          {currentBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No current bookings</p>
                  <p className="text-sm">Your active reservations will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            currentBookings.map(renderBookingCard)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No past bookings</p>
                  <p className="text-sm">Your booking history will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            pastBookings.map(renderBookingCard)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookingsPage;
