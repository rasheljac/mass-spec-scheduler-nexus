import React, { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Separator } from "../ui/separator";
import { Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { Comment } from "../../types";
import { useAuth } from "../../contexts/AuthContext";
import { useBooking } from "../../contexts/BookingContext";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";

interface BookingCommentsProps {
  bookingId: string;
  comments: Comment[];
  onCommentsChange: (comments: Comment[]) => void;
}

const BookingComments: React.FC<BookingCommentsProps> = ({
  bookingId,
  comments,
  onCommentsChange
}) => {
  const { user, users } = useAuth();
  const { addCommentToBooking, deleteCommentFromBooking, bookings } = useBooking();
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [deletingComments, setDeletingComments] = useState<Set<string>>(new Set());

  const handleAddComment = async () => {
    const commentContent = newComment.trim();
    if (!commentContent || !user) {
      console.log("Missing comment content or user");
      return;
    }

    try {
      setIsAddingComment(true);
      console.log("Adding comment:", commentContent);
      
      const commentId = await addCommentToBooking(bookingId, {
        userId: user.id,
        userName: user.name,
        content: commentContent,
        createdAt: new Date().toISOString()
      });
      
      if (commentId) {
        const newCommentObj: Comment = {
          id: commentId,
          userId: user.id,
          userName: user.name,
          content: commentContent,
          createdAt: new Date().toISOString()
        };
        
        onCommentsChange([...comments, newCommentObj]);
        setNewComment("");

        // Send email notification to booking owner
        const booking = bookings.find(b => b.id === bookingId);
        if (booking && booking.userId !== user.id) {
          try {
            console.log("Sending comment notification email");
            
            // Find the booking owner's email from the users array
            const bookingOwner = users.find(u => u.id === booking.userId);
            const recipientEmail = bookingOwner?.email || booking.userId;
            
            console.log("Recipient email:", recipientEmail);
            
            const { data, error } = await supabase.functions.invoke('send-email', {
              body: {
                to: recipientEmail,
                subject: `New Comment on Your Booking: ${booking.instrumentName}`,
                htmlContent: `
                  <h2>New Comment on Your Booking</h2>
                  <p><strong>Instrument:</strong> ${booking.instrumentName}</p>
                  <p><strong>Date:</strong> ${format(new Date(booking.start), "PPP 'at' p")}</p>
                  <p><strong>Comment by:</strong> ${user.name}</p>
                  <p><strong>Comment:</strong> ${commentContent}</p>
                  <br>
                  <p>Best regards,<br>Lab Management Team</p>
                `,
                templateType: 'comment_notification',
                variables: {
                  userName: booking.userName,
                  instrumentName: booking.instrumentName,
                  commentBy: user.name,
                  comment: commentContent,
                  bookingDate: format(new Date(booking.start), "PPP 'at' p")
                }
              }
            });
            
            if (error) {
              console.error("Email sending error:", error);
            } else {
              console.log("Comment notification email sent successfully:", data);
            }
          } catch (emailError) {
            console.error("Failed to send comment notification email:", emailError);
            // Don't show error to user for email failure
          }
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingComments.has(commentId)) {
      console.log("Comment deletion already in progress:", commentId);
      return;
    }

    try {
      setDeletingComments(prev => new Set(prev).add(commentId));
      console.log("Deleting comment:", commentId);
      
      await deleteCommentFromBooking(bookingId, commentId);
      onCommentsChange(comments.filter(comment => comment.id !== commentId));
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setDeletingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(commentId);
        return newSet;
      });
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return user?.role === "admin" || comment.userId === user?.id;
  };

  return (
    <div className="pt-4">
      <h3 className="text-lg font-medium flex items-center mb-2">
        <MessageSquare className="h-5 w-5 mr-2" />
        Comments
      </h3>
      <Card className="mb-4">
        <CardContent className="pt-4">
          {comments && comments.length > 0 ? (
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
                          disabled={deletingComments.has(comment.id)}
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
          
          <div className="flex space-x-2">
            <Textarea 
              placeholder="Add a comment..." 
              className="min-h-[60px] flex-1"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              type="button"
              onClick={handleAddComment}
              className="self-end"
              disabled={isAddingComment || !newComment.trim()}
            >
              {isAddingComment ? "Adding..." : "Add Comment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingComments;
