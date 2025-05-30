
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";

const UserManagementContainer: React.FC = () => {
  const { user: currentUser, updateUserProfile, updateUserPassword, users, createUser, deleteUser, refreshUsers } = useAuth();
  const { toast } = useToast();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    
    try {
      console.log('Starting user deletion process for:', userToDelete.id);
      
      // Delete related data first (comments, bookings, etc.)
      console.log('Deleting user comments...');
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('user_id', userToDelete.id);
      
      if (commentsError) {
        console.warn('Error deleting user comments:', commentsError);
        // Continue anyway, this might not be critical
      }

      console.log('Deleting user bookings...');
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', userToDelete.id);
      
      if (bookingsError) {
        console.warn('Error deleting user bookings:', bookingsError);
        // Continue anyway, this might not be critical
      }

      // Delete the profile (this is the most important part)
      console.log('Deleting user profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id);
        
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }

      console.log('Profile deleted successfully');

      // Update local state immediately
      deleteUser(userToDelete.id);
      
      // Refresh users list to ensure consistency
      if (refreshUsers) {
        console.log('Refreshing users list...');
        await refreshUsers();
      }
      
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "User deleted",
        description: "User profile and associated data have been deleted successfully"
      });
      
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Delete failed",
        description: `Failed to delete user: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
        onDelete={handleDeleteClick}
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{userToDelete?.name}" ({userToDelete?.email})? 
              This action cannot be undone and will delete the user profile and all associated data including bookings and comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserManagementContainer;
