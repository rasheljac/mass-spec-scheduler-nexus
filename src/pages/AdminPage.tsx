
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Redirect if user is not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // Refresh data when the admin page loads or when switching to certain tabs
  useEffect(() => {
    const handleTabRefresh = async () => {
      if (activeTab === "instruments" || activeTab === "status-colors") {
        console.log(`Refreshing data for tab: ${activeTab}`);
        setIsRefreshing(true);
        try {
          await refreshData();
        } catch (error) {
          console.error("Error refreshing data for tab:", error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    handleTabRefresh();
  }, [activeTab, refreshData]);

  const handleTabChange = (value: string) => {
    console.log(`Switching to tab: ${value}`);
    setActiveTab(value);
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      
      {(isLoading || isRefreshing) && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading data...</span>
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
