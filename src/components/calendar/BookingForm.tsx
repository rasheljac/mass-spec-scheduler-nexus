
import React, { useState, useEffect } from "react";
import { useBooking } from "../../contexts/BookingContext";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedTime?: string;
  instrumentId?: string;
}

const BookingForm: React.FC<BookingFormProps> = ({
  open,
  onOpenChange,
  selectedDate,
  selectedTime = "09:00",
  instrumentId
}) => {
  const { createBooking, instruments } = useBooking();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    selectedInstrument: instrumentId || "",
    selectedTime: selectedTime,
    duration: "1",
    purpose: "",
    details: "",
    sampleNumber: ""
  });

  const selectedInstrument = instruments.find(i => i.id === formData.selectedInstrument);

  // Auto-calculate duration based on sample number
  useEffect(() => {
    const sampleNum = parseInt(formData.sampleNumber);
    if (!isNaN(sampleNum) && sampleNum > 0) {
      let calculatedDuration = "1"; // Default 1 hour
      
      // Duration calculation logic based on sample number
      if (sampleNum <= 5) {
        calculatedDuration = "1";
      } else if (sampleNum <= 10) {
        calculatedDuration = "2";
      } else if (sampleNum <= 20) {
        calculatedDuration = "3";
      } else if (sampleNum <= 30) {
        calculatedDuration = "4";
      } else if (sampleNum <= 50) {
        calculatedDuration = "6";
      } else {
        calculatedDuration = "8";
      }
      
      setFormData(prev => ({ ...prev, duration: calculatedDuration }));
    }
  }, [formData.sampleNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedInstrument) return;

    setIsSubmitting(true);
    
    try {
      const [hours, minutes] = formData.selectedTime.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + parseInt(formData.duration));

      // Set initial status based on user role
      const initialStatus = user.role === "admin" ? "confirmed" : "pending";

      await createBooking({
        userId: user.id,
        userName: user.name,
        instrumentId: selectedInstrument.id,
        instrumentName: selectedInstrument.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        purpose: formData.purpose,
        details: formData.details + (formData.sampleNumber ? `\n\nSample Number: ${formData.sampleNumber}` : ""),
        status: initialStatus,
        comments: []
      });

      if (user.role === "admin") {
        toast.success("Booking created successfully");
      } else {
        toast.success("Booking request submitted for admin approval");
      }
      
      onOpenChange(false);
      // Reset form
      setFormData({
        selectedInstrument: "",
        selectedTime: "09:00",
        duration: "1",
        purpose: "",
        details: "",
        sampleNumber: ""
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="instrument">Instrument</Label>
            <Select
              value={formData.selectedInstrument}
              onValueChange={(value) => setFormData(prev => ({ ...prev, selectedInstrument: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an instrument" />
              </SelectTrigger>
              <SelectContent>
                {instruments.map(instrument => (
                  <SelectItem key={instrument.id} value={instrument.id}>
                    {instrument.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="text"
              value={format(selectedDate, "EEEE, MMMM d, yyyy")}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <Select
              value={formData.selectedTime}
              onValueChange={(value) => setFormData(prev => ({ ...prev, selectedTime: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }, (_, i) => {
                  const hour = 9 + i;
                  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                  return (
                    <SelectItem key={timeStr} value={timeStr}>
                      {hour === 12 ? "12:00 PM" : hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sampleNumber">Sample Number (Optional)</Label>
            <Input
              id="sampleNumber"
              type="number"
              value={formData.sampleNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, sampleNumber: e.target.value }))}
              placeholder="Enter number of samples"
              min="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Duration will be automatically calculated based on sample number
            </p>
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours)</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.5">1.5 hours</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="Brief description of the purpose"
              required
            />
          </div>

          <div>
            <Label htmlFor="details">Additional Details (Optional)</Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              placeholder="Any additional details or special requirements"
              className="min-h-[80px]"
            />
          </div>

          {user?.role !== "admin" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your booking will be submitted for admin approval and will be pending until confirmed.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.purpose.trim() || !formData.selectedInstrument}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {user?.role === "admin" ? "Creating..." : "Submitting..."}
                </>
              ) : (
                user?.role === "admin" ? "Create Booking" : "Submit for Approval"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingForm;
