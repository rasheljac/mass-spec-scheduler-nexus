
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
import { sendEmail } from "../../utils/emailNotifications";

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
            console.log("Sending comment notification email");
            
            // Find the booking owner's email from the users array
            const bookingOwner = users.find(u => u.id === booking.userId);
            if (bookingOwner?.email) {
              console.log("Sending email to:", bookingOwner.email);
              
              const emailSent = await sendEmail({
                to: bookingOwner.email,
                subject: `New Comment on Your Booking: ${booking.instrumentName}`,
                body: `A new comment has been added to your booking for ${booking.instrumentName}.`,
                htmlContent: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <h2 style="color: #333; margin-bottom: 20px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">New Comment on Your Booking</h2>
                      
                      <div style="margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Instrument:</strong> ${booking.instrumentName}</p>
                        <p style="margin: 5px 0;"><strong>Date:</strong> ${format(new Date(booking.start), "PPP 'at' p")}</p>
                        <p style="margin: 5px 0;"><strong>Comment by:</strong> ${user.name}</p>
                      </div>
                      
                      <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">Comment:</h4>
                        <p style="margin: 0; line-height: 1.5;">${commentContent}</p>
                      </div>
                      
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666;">
                        <p>Best regards,<br>Lab Management Team</p>
                      </div>
                    </div>
                  </div>
                `,
                templateType: 'comment_notification',
                variables: {
                  userName: bookingOwner.name || 'User',
                  instrumentName: booking.instrumentName,
                  commentBy: user.name,
                  commentContent: commentContent,
                  bookingDate: format(new Date(booking.start), "PPP 'at' p")
                },
                emailType: 'notification'
              });
              
              if (emailSent) {
                console.log("Comment notification email sent successfully");
                toast.success("Comment added and notification sent");
              } else {
                console.log("Comment added but email notification failed");
                toast.success("Comment added successfully");
              }
            } else {
              console.log("No email found for booking owner");
              toast.success("Comment added successfully");
            }
          } catch (emailError) {
            console.error("Failed to send comment notification email:", emailError);
            toast.success("Comment added successfully");
          }
        } else {
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
