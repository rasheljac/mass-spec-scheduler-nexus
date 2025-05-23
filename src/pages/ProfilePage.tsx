
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import PasswordDialog from "../components/admin/PasswordDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Image } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { supabase } from "../integrations/supabase/client";

const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, updateUserPassword } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profileImage || null
  );
  const [newPassword, setNewPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  if (!user) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);
      
      // Handle file upload to Supabase storage
      let profileImageUrl = user.profileImage;
      
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, selectedFile, {
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        profileImageUrl = urlData.publicUrl;
      }

      await updateUserProfile({
        ...user,
        name,
        email,
        department,
        profileImage: profileImageUrl
      });
      
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Password not updated",
        description: "Please provide a valid password.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingPassword(true);
    
    try {
      await updateUserPassword(user.id, newPassword);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error) {
      toast({
        title: "Error updating password",
        description: "There was an error updating the password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Helper function to read a file as data URL
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">My Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              View and edit your personal information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing || isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing || isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!isEditing || isUpdating}
                placeholder="e.g., Research, Chemistry, Biology"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant="outline">{user.role === "admin" ? "Administrator" : "User"}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Profile Image</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={imagePreview || undefined} alt={name} />
                  <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="space-y-2">
                    <Input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Label 
                      htmlFor="profileImage" 
                      className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium cursor-pointer hover:bg-gray-200"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Choose photo
                    </Label>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setName(user?.name || "");
                    setEmail(user?.email || "");
                    setDepartment(user?.department || "");
                    setImagePreview(user?.profileImage || null);
                    setSelectedFile(null);
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isUpdating}>
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Manage your account password and security settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground">
                Update your password to maintain account security.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => setIsPasswordDialogOpen(true)}
            >
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </div>

      <PasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSave={handleChangePassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        isSubmitting={isSubmittingPassword}
      />
    </div>
  );
};

export default ProfilePage;
