
import React, { useState } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { useAuth } from "../../../contexts/AuthContext";
import { User, CreateUserData } from "../../../types";
import { useToast } from "../../../hooks/use-toast";
import UserTable from "../UserTable";
import EditUserDialog from "../EditUserDialog";
import PasswordDialog from "../PasswordDialog";
import AddUserDialog from "../AddUserDialog";
import { supabase } from "../../../integrations/supabase/client";

const UserManagementContainer: React.FC = () => {
  const { user: currentUser, updateUserProfile, updateUserPassword, users, createUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditUser(userToEdit);
      setIsDialogOpen(true);
    }
  };

  const handleSaveEdit = async (updatedUser: User) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: updatedUser.name,
          email: updatedUser.email,
          department: updatedUser.department,
          role: updatedUser.role,
          profile_image: updatedUser.profileImage
        })
        .eq('id', updatedUser.id);
        
      if (error) throw error;
      
      updateUserProfile(updatedUser);
      setIsDialogOpen(false);
      setEditUser(null);
      toast({
        title: "User updated",
        description: "User profile has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update user profile",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      deleteUser(userId);
      toast({
        title: "User deleted",
        description: "User has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleChangeRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const userToUpdate = users.find(u => u.id === userId);
      if (userToUpdate) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', userId);
          
        if (error) throw error;
        
        const updatedUser = { ...userToUpdate, role: newRole };
        updateUserProfile(updatedUser);
        toast({
          title: "Role updated",
          description: `User role changed to ${newRole}`
        });
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Role update failed",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const openPasswordDialog = (userId: string) => {
    setUserId(userId);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!userId || !newPassword.trim()) {
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

    setIsSubmitting(true);
    
    try {
      await updateUserPassword(userId, newPassword);
      
      toast({
        title: "Password updated",
        description: "The user's password has been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error updating password",
        description: "There was an error updating the password.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsPasswordDialogOpen(false);
      setUserId(null);
      setNewPassword("");
    }
  };

  const handleAddUser = async (userData: CreateUserData) => {
    try {
      await createUser(userData);
      setIsAddUserDialogOpen(false);
      toast({
        title: "User added",
        description: "New user has been created successfully"
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "User creation failed",
        description: "Failed to create new user",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>Add User</Button>
      </div>

      <UserTable 
        users={users}
        currentUserId={currentUser?.id}
        onEdit={handleEdit}
        onChangeRole={handleChangeRole}
        onChangePassword={openPasswordDialog}
        onDelete={handleDelete}
      />
      
      <EditUserDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={editUser}
        onSave={handleSaveEdit}
      />
      
      <PasswordDialog 
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSave={handleChangePassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        isSubmitting={isSubmitting}
      />
      
      <AddUserDialog 
        isOpen={isAddUserDialogOpen}
        onClose={() => setIsAddUserDialogOpen(false)}
        onSave={handleAddUser}
      />
    </Card>
  );
};

export default UserManagementContainer;
