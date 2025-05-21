
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

const AuthModal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("login");

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-mslab-400">Mass Spec Lab</CardTitle>
        <CardDescription>
          Please log in to access the scheduling system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
            <div className="text-center mt-4 text-sm text-muted-foreground">
              <p>Demo credentials:</p>
              <p>Email: admin@mslab.com</p>
              <p>Password: password</p>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <SignupForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AuthModal;
