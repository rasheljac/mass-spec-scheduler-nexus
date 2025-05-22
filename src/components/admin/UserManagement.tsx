
import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { User } from "../../types";
import { useToast } from "../../hooks/use-toast";
import UserTable from "./UserTable";
import EditUserDialog from "./EditUserDialog";
import PasswordDialog from "./PasswordDialog";
import AddUserDialog from "./AddUserDialog";

const UserManagement: React.FC = () => {
  const { user: currentUser, updateUserProfile, updateUserPassword, users, setUsers, createUser, deleteUser } = useAuth();
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

  const handleSaveEdit = (updatedUser: User) => {
    updateUserProfile(updatedUser);
    setIsDialogOpen(false);
    setEditUser(null);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate) {
      const updatedUser = { ...userToUpdate, role: newRole };
      updateUserProfile(updatedUser);
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

  const handleAddUser = (userData: Omit<User, "id">) => {
    createUser(userData);
    setIsAddUserDialogOpen(false);
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

export default UserManagement;
