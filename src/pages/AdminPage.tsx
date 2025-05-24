
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useBooking } from "../contexts/BookingContext";
import UserManagement from "../components/admin/UserManagement";
import InstrumentManagement from "../components/admin/InstrumentManagement";
import DelaySchedule from "../components/admin/DelaySchedule";
import StatusColorManagement from "../components/admin/StatusColorManagement";
import SmtpSettings from "../components/admin/SmtpSettings";
import EmailTemplatesManagement from "../components/admin/EmailTemplatesManagement";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { refreshData, isLoading } = useBooking();
  const [activeTab, setActiveTab] = useState("users");
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Redirect if user is not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Only refresh data on initial load, not on every tab change
  useEffect(() => {
    const handleInitialLoad = async () => {
      if (isInitialLoad) {
        console.log("AdminPage: Initial data refresh");
        try {
          await refreshData();
        } catch (error) {
          console.error("Error refreshing admin data:", error);
        } finally {
          setIsInitialLoad(false);
        }
      }
    };

    handleInitialLoad();
  }, [isInitialLoad, refreshData]);

  const handleTabChange = (value: string) => {
    console.log(`AdminPage: Switching to tab: ${value}`);
    setActiveTab(value);
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      
      {isLoading && isInitialLoad && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading admin data...</span>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-6 w-[700px]">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="instruments">Instruments</TabsTrigger>
          <TabsTrigger value="delays">Schedule Delays</TabsTrigger>
          <TabsTrigger value="status-colors">Status Colors</TabsTrigger>
          <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
          <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        
        <TabsContent value="instruments" className="mt-6">
          <InstrumentManagement />
        </TabsContent>
        
        <TabsContent value="delays" className="mt-6">
          <DelaySchedule />
        </TabsContent>
        
        <TabsContent value="status-colors" className="mt-6">
          <StatusColorManagement />
        </TabsContent>
        
        <TabsContent value="smtp" className="mt-6">
          <SmtpSettings />
        </TabsContent>
        
        <TabsContent value="email-templates" className="mt-6">
          <EmailTemplatesManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
