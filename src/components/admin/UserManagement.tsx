
import React, { useState } from "react";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { User } from "../../types";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([
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
  ]);

  // In a real app, these would call APIs
  const handleEdit = (userId: string) => {
    console.log(`Edit user: ${userId}`);
    // Implement edit functionality
  };

  const handleDelete = (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.");
      return;
    }
    
    setUsers(users.filter(u => u.id !== userId));
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button>Add User</Button>
      </div>

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
                  onClick={() => handleChangeRole(user.id, user.role === "admin" ? "user" : "admin")}
                >
                  {user.role === "admin" ? "Make User" : "Make Admin"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(user.id)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  disabled={user.id === currentUser?.id}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

export default UserManagement;
