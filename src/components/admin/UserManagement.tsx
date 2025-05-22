
import React, { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { useAuth } from "../../contexts/AuthContext";
import { User } from "../../types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
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
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    setIsDialogOpen(false);
    setEditUser(null);
    toast({
      title: "User updated",
      description: `User ${updatedUser.name} has been updated successfully.`
    });
  };

  const handleDelete = (userId: string) => {
    // Don't allow deleting yourself
    if (userId === currentUser?.id) {
      toast({
        title: "Cannot delete account",
        description: "You cannot delete your own account.",
        variant: "destructive"
      });
      return;
    }
    
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: "User deleted",
      description: "User has been deleted successfully."
    });
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
    toast({
      title: "Role updated",
      description: `User role has been changed to ${newRole}.`
    });
  };

  // Edit User Dialog
  const EditUserDialog = () => {
    const [name, setName] = useState(editUser?.name || "");
    const [email, setEmail] = useState(editUser?.email || "");
    const [department, setDepartment] = useState(editUser?.department || "");

    useEffect(() => {
      if (editUser) {
        setName(editUser.name);
        setEmail(editUser.email);
        setDepartment(editUser.department || "");
      }
    }, [editUser]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editUser) {
        handleSaveEdit({
          ...editUser,
          name,
          email,
          department
        });
      }
    };

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
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
      
      {/* Edit User Dialog */}
      {editUser && <EditUserDialog />}
    </Card>
  );
};

export default UserManagement;
