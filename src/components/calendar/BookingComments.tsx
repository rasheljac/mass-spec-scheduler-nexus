
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
import { createCommentNotification, sendEmail } from "../../utils/emailNotifications";

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
      
      const commentData = {
        userId: user.id,
        userName: user.name,
        content: commentContent,
        createdAt: new Date().toISOString()
      };

      const commentId = await addCommentToBooking(bookingId, commentData);
      
      if (commentId) {
        const newCommentObj: Comment = {
          id: commentId,
          ...commentData
        };
        
        // Update the comments list immediately
        onCommentsChange([...comments, newCommentObj]);
        setNewComment("");
        console.log("Comment added successfully with ID:", commentId);

        // Send email notification to booking owner
        const booking = bookings.find(b => b.id === bookingId);
        if (booking && booking.userId !== user.id) {
          try {
            console.log("Sending comment notification email for booking:", booking.id);
            
            // Find the booking owner's email from the users array
            const bookingOwner = users.find(u => u.id === booking.userId);
            if (bookingOwner?.email) {
              console.log("Sending comment notification to:", bookingOwner.email);
              
              // Create the notification using the centralized function
              const emailNotification = createCommentNotification(
                bookingOwner.email,
                bookingOwner.name || 'User',
                booking.instrumentName,
                user.name,
                commentContent,
                format(new Date(booking.start), "PPP 'at' p")
              );
              
              console.log("Email notification object created:", {
                to: emailNotification.to,
                subject: emailNotification.subject,
                hasVariables: !!emailNotification.variables,
                variableCount: Object.keys(emailNotification.variables || {}).length
              });
              
              const emailSent = await sendEmail({
                ...emailNotification,
                emailType: 'notification'
              });
              
              if (emailSent) {
                console.log("Comment notification email sent successfully");
                toast.success("Comment added and notification sent");
              } else {
                console.error("Comment notification email failed to send");
                toast.success("Comment added but notification failed to send");
              }
            } else {
              console.log("No email found for booking owner:", booking.userId);
              toast.success("Comment added successfully");
            }
          } catch (emailError) {
            console.error("Failed to send comment notification email:", emailError);
            toast.success("Comment added but notification failed to send");
          }
        } else {
          console.log("Not sending email - same user or booking not found");
          toast.success("Comment added successfully");
        }
      } else {
        throw new Error("Failed to get comment ID");
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
              disabled={isAddingComment}
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
