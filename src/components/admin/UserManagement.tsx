
import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { User } from "../../types";
import { useToast } from "../../hooks/use-toast";
import UserTable from "./UserTable";
import EditUserDialog from "./EditUserDialog";
import PasswordDialog from "./PasswordDialog";

const UserManagement: React.FC = () => {
  const { user: currentUser, updateUserInStorage, updateCurrentUser, changePassword } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("mslab_users");
    return savedUsers 
      ? JSON.parse(savedUsers) 
      : [
        {
          id: "1",
          name: "Admin User",
          email: "admin@mslab.com",
          role: "admin",
          department: "Core Facility"
        },
        {
          id: "2",
          name: "John Researcher",
          email: "john@mslab.com",
          role: "user",
          department: "Proteomics"
        },
        {
          id: "3",
          name: "Sarah Scientist",
          email: "sarah@mslab.com",
          role: "user",
          department: "Metabolomics"
        }
      ];
  });

  const [editUser, setEditUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mslab_users", JSON.stringify(users));
  }, [users]);

  const handleEdit = (userId: string) => {
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditUser(userToEdit);
      setIsDialogOpen(true);
    }
  };

  const handleSaveEdit = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    
    // Update user in storage
    updateUserInStorage(updatedUser);
    
    // If the edited user is the current user, update current user as well
    if (currentUser && currentUser.id === updatedUser.id) {
      updateCurrentUser(updatedUser);
    }
    
    setIsDialogOpen(false);
    setEditUser(null);
    toast({
      title: "User updated",
      description: `User ${updatedUser.name} has been updated successfully.`
    });
  };

  const handleDelete = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "User deleted",
      description: "User has been deleted successfully."
    });
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const updatedUser = { ...u, role: newRole };
        
        // If the edited user is the current user, update current user as well
        if (currentUser && currentUser.id === userId) {
          updateCurrentUser(updatedUser);
        }
        
        return updatedUser;
      }
      return u;
    });
    
    setUsers(updatedUsers);
    localStorage.setItem("mslab_users", JSON.stringify(updatedUsers));
    
    toast({
      title: "Role updated",
      description: `User role has been changed to ${newRole}.`
    });
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
      await changePassword(userId, newPassword);
      
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

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button>Add User</Button>
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
    </Card>
  );
};

export default UserManagement;
