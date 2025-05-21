
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { useBooking } from "../../contexts/BookingContext";

const InstrumentStatus: React.FC = () => {
  const { instruments } = useBooking();

  // Helper to determine the status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "maintenance":
        return "bg-yellow-500";
      case "in-use":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Instrument Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {instruments.map((instrument) => (
            <div key={instrument.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{instrument.name}</p>
                <p className="text-sm text-muted-foreground">{instrument.location}</p>
              </div>
              <Badge
                variant="outline"
                className="flex items-center gap-2 capitalize"
              >
                <div className={`w-2 h-2 rounded-full ${getStatusColor(instrument.status)}`}></div>
                {instrument.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InstrumentStatus;
