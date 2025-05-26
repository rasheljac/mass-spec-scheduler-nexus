
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, CalendarIcon, Clock } from "lucide-react";
import { cn } from "../../lib/utils";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
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
    selectedDate: selectedDate || new Date(),
    selectedTime: selectedTime,
    duration: "1",
    purpose: "",
    details: "",
    sampleNumber: "",
    sampleRunTime: ""
  });

  const selectedInstrument = instruments.find(i => i.id === formData.selectedInstrument);

  // Generate time options in 30-minute increments for 24 hours
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour < 12 ? "AM" : "PM";
    const displayTime = `${hour12}:${minute} ${ampm}`;
    return { value: timeStr, display: displayTime };
  });

  // Auto-calculate duration when sample data changes
  useEffect(() => {
    console.log("Duration calculation triggered:", { 
      sampleNumber: formData.sampleNumber, 
      sampleRunTime: formData.sampleRunTime 
    });
    
    if (formData.sampleNumber && formData.sampleRunTime) {
      const totalSamples = parseInt(formData.sampleNumber);
      const runTimePerSample = parseFloat(formData.sampleRunTime);
      
      console.log("Parsed values:", { totalSamples, runTimePerSample });
      
      if (totalSamples > 0 && runTimePerSample > 0) {
        // Calculate total runtime + 15 minutes setup time
        const totalMinutes = (totalSamples * runTimePerSample) + 15;
        const totalHours = totalMinutes / 60;
        const roundedHours = Math.ceil(totalHours * 2) / 2; // Round to nearest 0.5 hours
        
        console.log("Calculated duration:", { totalMinutes, totalHours, roundedHours });
        
        setFormData(prev => ({ ...prev, duration: roundedHours.toString() }));
      }
    }
  }, [formData.sampleNumber, formData.sampleRunTime]);

  // Calculate end date/time
  const calculateEndDateTime = () => {
    const [hours, minutes] = formData.selectedTime.split(':').map(Number);
    const startDate = new Date(formData.selectedDate);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    const durationHours = parseFloat(formData.duration);
    endDate.setHours(startDate.getHours() + Math.floor(durationHours));
    endDate.setMinutes(startDate.getMinutes() + ((durationHours % 1) * 60));
    
    return endDate;
  };

  // Handle sample number change
  const handleSampleNumberChange = (value: string) => {
    console.log("Sample number changed:", value);
    setFormData(prev => ({ ...prev, sampleNumber: value }));
  };

  // Handle sample run time change
  const handleSampleRunTimeChange = (value: string) => {
    console.log("Sample run time changed:", value);
    setFormData(prev => ({ ...prev, sampleRunTime: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedInstrument) {
      console.error("Missing user or instrument data");
      toast.error("Missing required information");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const [hours, minutes] = formData.selectedTime.split(':').map(Number);
      const startDate = new Date(formData.selectedDate);
      startDate.setHours(hours, minutes, 0, 0);
      
      const endDate = calculateEndDateTime();

      // Always set status as pending for new bookings
      const initialStatus = "pending";

      // Build details with sample information
      let detailsText = formData.details;
      if (formData.sampleNumber && formData.sampleRunTime) {
        detailsText += `\n\nSample Information:`;
        detailsText += `\n- Total Samples: ${formData.sampleNumber}`;
        detailsText += `\n- Run Time per Sample: ${formData.sampleRunTime} minutes`;
        detailsText += `\n- Calculated Duration: ${formData.duration} hours`;
      } else if (formData.sampleNumber) {
        detailsText += `\n\nSample Number: ${formData.sampleNumber}`;
      }

      console.log("Submitting booking with data:", {
        userId: user.id,
        userName: user.name,
        instrumentId: selectedInstrument.id,
        instrumentName: selectedInstrument.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        purpose: formData.purpose,
        details: detailsText,
        status: initialStatus,
        comments: []
      });

      await createBooking({
        userId: user.id,
        userName: user.name,
        instrumentId: selectedInstrument.id,
        instrumentName: selectedInstrument.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        purpose: formData.purpose,
        details: detailsText,
        status: initialStatus,
        comments: []
      });

      toast.success("Booking request submitted for admin approval");
      
      onOpenChange(false);
      // Reset form
      setFormData({
        selectedInstrument: "",
        selectedDate: new Date(),
        selectedTime: "09:00",
        duration: "1",
        purpose: "",
        details: "",
        sampleNumber: "",
        sampleRunTime: ""
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.selectedDate ? format(formData.selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.selectedDate}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, selectedDate: date }))}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="time">Start Time</Label>
            <Select
              value={formData.selectedTime}
              onValueChange={(value) => setFormData(prev => ({ ...prev, selectedTime: value }))}
            >
              <SelectTrigger>
                <Clock className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {timeOptions.map((time) => (
                  <SelectItem key={time.value} value={time.value}>
                    {time.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sampleNumber">Total Samples</Label>
              <Input
                id="sampleNumber"
                type="number"
                value={formData.sampleNumber}
                onChange={(e) => handleSampleNumberChange(e.target.value)}
                placeholder="Number of samples"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="sampleRunTime">Run Time (min/sample)</Label>
              <Input
                id="sampleRunTime"
                type="number"
                step="0.1"
                value={formData.sampleRunTime}
                onChange={(e) => handleSampleRunTimeChange(e.target.value)}
                placeholder="Minutes per sample"
                min="0.1"
              />
            </div>
          </div>

          {formData.sampleNumber && formData.sampleRunTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Auto-calculated:</strong> {formData.sampleNumber} samples × {formData.sampleRunTime} min + 15 min setup = {formData.duration} hours total
              </p>
            </div>
          )}

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
            <p className="text-xs text-muted-foreground mt-1">
              Duration is auto-calculated when both sample fields are filled
            </p>
          </div>

          {formData.selectedDate && formData.selectedTime && formData.duration && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>End Time:</strong> {format(calculateEndDateTime(), "PPP 'at' p")}
              </p>
            </div>
          )}

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your booking will be submitted for admin approval and will be pending until confirmed.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.purpose.trim() || !formData.selectedInstrument}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Approval"
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
