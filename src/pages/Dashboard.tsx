
import React from "react";
import InstrumentStatus from "../components/dashboard/InstrumentStatus";
import UpcomingBookings from "../components/dashboard/UpcomingBookings";
import UsageStatistics from "../components/dashboard/UsageStatistics";

const Dashboard: React.FC = () => {
  console.log("Dashboard component rendering"); // Add this log to debug
  
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InstrumentStatus />
        <UpcomingBookings />
        <UsageStatistics />
      </div>
    </div>
  );
};

export default Dashboard;
