
import React from "react";
import InstrumentStatus from "../components/dashboard/InstrumentStatus";
import UpcomingBookings from "../components/dashboard/UpcomingBookings";
import UsageStatistics from "../components/dashboard/UsageStatistics";

const Dashboard: React.FC = () => {
  console.log("Dashboard component rendering"); // Keep the debug log
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <InstrumentStatus />
        <UpcomingBookings />
        <div className="col-span-1 lg:col-span-3 md:col-span-2">
          <UsageStatistics />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
