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
      console.log('=== Starting user deletion process ===');
      console.log('User to delete:', userToDelete.id, userToDelete.email);
      
      // Step 1: Delete all comments associated with the user
      console.log('Step 1: Deleting user comments...');
      const { error: commentsError, count: commentsCount } = await supabase
        .from('comments')
        .delete({ count: 'exact' })
        .eq('user_id', userToDelete.id);
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
        throw new Error(`Failed to delete user comments: ${commentsError.message}`);
      }
      console.log(`Deleted ${commentsCount || 0} comments`);

      // Step 2: Delete all bookings associated with the user
      console.log('Step 2: Deleting user bookings...');
      const { error: bookingsError, count: bookingsCount } = await supabase
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('user_id', userToDelete.id);
      
      if (bookingsError) {
        console.error('Error deleting bookings:', bookingsError);
        throw new Error(`Failed to delete user bookings: ${bookingsError.message}`);
      }
      console.log(`Deleted ${bookingsCount || 0} bookings`);

      // Step 3: Delete the user profile
      console.log('Step 3: Deleting user profile...');
      const { error: profileError, count: profileCount } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .eq('id', userToDelete.id);
        
      if (profileError) {
        console.error('Error deleting profile:', profileError);
        throw new Error(`Failed to delete user profile: ${profileError.message}`);
      }
      console.log(`Deleted ${profileCount || 0} profiles`);

      if (!profileCount || profileCount === 0) {
        throw new Error('No profile was deleted - user may not exist');
      }

      console.log('=== User deletion completed successfully ===');

      // Step 4: Update local state immediately
      console.log('Step 4: Updating local state...');
      deleteUser(userToDelete.id);
      
      // Step 5: Refresh the users list from the database
      console.log('Step 5: Refreshing users list...');
      if (refreshUsers) {
        await refreshUsers();
      }
      
      // Step 6: Close dialog and show success message
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      
      toast({
        title: "User deleted successfully",
        description: `User ${userToDelete.name} and all associated data have been permanently deleted.`
      });
      
      console.log('=== User deletion process completed ===');
      
    } catch (error) {
      console.error('=== User deletion failed ===');
      console.error('Error details:', error);
      
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
            <AlertDialogTitle>Delete User Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete user "{userToDelete?.name}" ({userToDelete?.email})? 
              <br /><br />
              <strong>This action cannot be undone and will permanently delete:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>User profile and account data</li>
                <li>All bookings created by this user</li>
                <li>All comments made by this user</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default UserManagementContainer;
