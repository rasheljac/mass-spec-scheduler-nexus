
import React, { useEffect } from "react";
import InstrumentStatus from "../components/dashboard/InstrumentStatus";
import UpcomingBookings from "../components/dashboard/UpcomingBookings";
import UsageStatistics from "../components/dashboard/UsageStatistics";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

const Dashboard: React.FC = () => {
  console.log("Dashboard component rendering"); // Keep the debug log
  
  useEffect(() => {
    // Check Supabase connection when dashboard loads
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('instruments').select('count');
        if (error) {
          console.error('Error connecting to Supabase:', error);
          toast.error('Error connecting to database');
        } else {
          console.log('Successfully connected to Supabase');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };
    
    checkConnection();
  }, []);
  
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
