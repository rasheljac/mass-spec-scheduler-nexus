
import React from "react";
import { FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Check, Clock, Loader, CircleX } from "lucide-react";

interface BookingStatusSelectProps {
  control: any;
  name: string;
  label?: string;
}

const BookingStatusSelect: React.FC<BookingStatusSelectProps> = ({
  control,
  name,
  label = "Status"
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="Not-Started" className="flex items-center gap-2">
                <CircleX className="h-4 w-4 text-red-500" /> Not Started
              </SelectItem>
              <SelectItem value="In-Progress" className="flex items-center gap-2">
                <Loader className="h-4 w-4 text-blue-500" /> In Progress
              </SelectItem>
              <SelectItem value="Completed" className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" /> Completed
              </SelectItem>
              <SelectItem value="Delayed" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" /> Delayed
              </SelectItem>
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
};

export default BookingStatusSelect;
