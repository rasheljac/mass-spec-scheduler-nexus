
import React from "react";
import { useBooking } from "../contexts/BookingContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

const InstrumentsPage: React.FC = () => {
  const { instruments } = useBooking();

  // Helper to determine the status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500 text-white";
      case "maintenance":
        return "bg-yellow-500 text-white";
      case "in-use":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Instruments</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((instrument) => (
          <Card key={instrument.id} className="overflow-hidden">
            <div className="h-40 bg-mslab-100 flex items-center justify-center">
              {instrument.image ? (
                <img 
                  src={instrument.image} 
                  alt={instrument.name} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-mslab-400 text-5xl font-bold opacity-20">
                  {instrument.name.substring(0, 2)}
                </div>
              )}
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{instrument.name}</CardTitle>
                <Badge className={getStatusColor(instrument.status)}>
                  {instrument.status}
                </Badge>
              </div>
              <CardDescription>{instrument.model}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                <strong>Location:</strong> {instrument.location}
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/calendar" className="w-full">
                <Button 
                  variant={instrument.status === "available" ? "default" : "outline"}
                  disabled={instrument.status !== "available"}
                  className="w-full"
                >
                  {instrument.status === "available" ? "Book Now" : "Currently Unavailable"}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InstrumentsPage;
