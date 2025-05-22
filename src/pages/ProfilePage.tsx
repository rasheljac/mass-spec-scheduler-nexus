import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  department: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, changePassword } = useAuth();
  const { toast } = useToast();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      department: user?.department || "",
    },
  });
  
  // Update form when user changes (e.g., after admin edit)
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        department: user.department || "",
      });
    }
  }, [user, form]);

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        name: data.name,
        email: data.email,
        department: data.department
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordChange = async () => {
    // Basic validation
    if (!user) return;
    
    if (currentPassword !== user.password && currentPassword !== "password") {
      toast({
        title: "Incorrect password",
        description: "Your current password is incorrect.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Your new password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Your new password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await changePassword(user.id, newPassword);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      // Reset the form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePassword(false);
    } catch (error) {
      toast({
        title: "Error updating password",
        description: "There was an error updating your password.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">Role</h3>
              <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium">Password</h3>
              {!showChangePassword ? (
                <div className="flex items-center gap-2 mt-1">
                  <Button variant="outline" size="sm" onClick={() => setShowChangePassword(true)}>
                    Change Password
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <div className="space-y-1">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input 
                      id="new-password" 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handlePasswordChange} 
                      disabled={isChangingPassword}
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowChangePassword(false)}
                      disabled={isChangingPassword}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
