
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import UserManagement from "../components/admin/UserManagement";
import InstrumentManagement from "../components/admin/InstrumentManagement";
import DelaySchedule from "../components/admin/DelaySchedule";
import StatusColorManagement from "../components/admin/StatusColorManagement";
import { Navigate } from "react-router-dom";

const AdminPage: React.FC = () => {
  const { user } = useAuth();

  // Redirect if user is not admin
  if (!user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
      
      <Tabs defaultValue="users">
        <TabsList className="grid grid-cols-4 w-[500px]">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="instruments">Instruments</TabsTrigger>
          <TabsTrigger value="delays">Schedule Delays</TabsTrigger>
          <TabsTrigger value="status-colors">Status Colors</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default AdminPage;
