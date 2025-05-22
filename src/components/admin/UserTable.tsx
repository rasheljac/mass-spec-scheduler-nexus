
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { User } from "../../types";
import { useToast } from "../../hooks/use-toast";

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  onEdit: (userId: string) => void;
  onChangeRole: (userId: string, newRole: 'admin' | 'user') => void;
  onChangePassword: (userId: string) => void;
  onDelete: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  currentUserId, 
  onEdit, 
  onChangeRole, 
  onChangePassword, 
  onDelete 
}) => {
  const { toast } = useToast();

  const handleDelete = (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUserId) {
      toast({
        title: "Cannot delete account",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }
    
    onDelete(userId);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(user => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>{user.department || "-"}</TableCell>
            <TableCell className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onChangeRole(user.id, user.role === "admin" ? "user" : "admin")}
              >
                {user.role === "admin" ? "Make User" : "Make Admin"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onChangePassword(user.id)}
              >
                Password
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEdit(user.id)}
              >
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDelete(user.id)}
                disabled={user.id === currentUserId}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default UserTable;
