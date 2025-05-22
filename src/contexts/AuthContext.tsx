import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../types';
import { useToast } from '../hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  updateUserProfile: (userData: User) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  getUserById: (userId: string) => User | undefined;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  createUser: (userData: Omit<User, "id">) => void;
  updateUser: (userData: User) => void;
  deleteUser: (userId: string) => void;
}

const defaultUsers: User[] = [
  { 
    id: '1', 
    name: 'Admin User', 
    email: 'admin@example.com', 
    password: 'admin123', 
    role: 'admin',
    department: 'IT Administration',
    profileImage: ''
  },
  { 
    id: '2', 
    name: 'John Researcher', 
    email: 'john@example.com', 
    password: 'john123', 
    role: 'user',
    department: 'Research',
    profileImage: ''
  },
  { 
    id: '3', 
    name: 'Sarah Scientist', 
    email: 'sarah@example.com', 
    password: 'sarah123', 
    role: 'user',
    department: 'Laboratory',
    profileImage: ''
  },
  {
    id: '4',
    name: 'Eddy Kapelczak',
    email: 'eddy@kapelczak.com',
    password: 'Eddie#12',
    role: 'admin', // Changed from 'user' to 'admin'
    department: 'Research',
    profileImage: ''
  }
];

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  signup: async () => false,
  updateUserProfile: async () => {},
  updateUserPassword: async () => false,
  getUserById: () => undefined,
  users: [],
  setUsers: () => {},
  createUser: () => {},
  updateUser: () => {},
  deleteUser: () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  
  // Initialize users state from localStorage or use default
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const storedUsers = localStorage.getItem('mslab_users');
      
      // If there are stored users, but the eddy@kapelczak.com user is missing or not admin, update it
      if (storedUsers) {
        const parsedUsers = JSON.parse(storedUsers);
        const eddyIndex = parsedUsers.findIndex((u: User) => 
          u.email.toLowerCase() === 'eddy@kapelczak.com'
        );
        
        if (eddyIndex === -1) {
          // Add the missing user with admin role
          parsedUsers.push({
            id: '4',
            name: 'Eddy Kapelczak',
            email: 'eddy@kapelczak.com',
            password: 'Eddie#12',
            role: 'admin',
            department: 'Research',
            profileImage: ''
          });
        } else if (parsedUsers[eddyIndex].role !== 'admin') {
          // Update existing user to admin
          parsedUsers[eddyIndex].role = 'admin';
        }
        
        // Update localStorage with the fixed users array
        localStorage.setItem('mslab_users', JSON.stringify(parsedUsers));
        return parsedUsers;
      }
      
      // If no users in localStorage, store the default users
      localStorage.setItem('mslab_users', JSON.stringify(defaultUsers));
      return defaultUsers;
    } catch (error) {
      console.error("Error loading users from localStorage:", error);
      return defaultUsers;
    }
  });
  
  // Initialize user state from localStorage
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedUser = localStorage.getItem('mslab_current_user');
      
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // If the stored user is Eddy, make sure role is admin
        if (parsedUser.email.toLowerCase() === 'eddy@kapelczak.com' && parsedUser.role !== 'admin') {
          parsedUser.role = 'admin';
          localStorage.setItem('mslab_current_user', JSON.stringify(parsedUser));
        }
        return parsedUser;
      }
      
      return null;
    } catch (error) {
      console.error("Error loading current user from localStorage:", error);
      return null;
    }
  });
  
  // Update localStorage when users change
  useEffect(() => {
    try {
      localStorage.setItem('mslab_users', JSON.stringify(users));
    } catch (error) {
      console.error("Error saving users to localStorage:", error);
    }
  }, [users]);
  
  // Update localStorage when current user changes
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('mslab_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('mslab_current_user');
      }
    } catch (error) {
      console.error("Error saving current user to localStorage:", error);
    }
  }, [user]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log(`Login attempt for: ${email} with password: ${password}`);
    
    // Clear case-sensitivity issues - normalize email for comparison
    const normalizedEmail = email.toLowerCase().trim();
    
    // Log available users for debugging
    console.log(`Available users:`, users.map(u => ({ 
      id: u.id,
      email: u.email, 
      password: u.password 
    })));
    
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Debug output
        console.log("Normalized email for login:", normalizedEmail);
        
        const foundUser = users.find(u => {
          // Normalize stored email for comparison
          const storedEmail = u.email.toLowerCase().trim();
          const emailMatch = storedEmail === normalizedEmail;
          const passwordMatch = u.password === password;
          
          console.log(`Checking ${u.email}: email match = ${emailMatch}, password match = ${passwordMatch}`);
          
          return emailMatch && passwordMatch;
        });
        
        if (foundUser) {
          console.log("User found, logging in:", foundUser.name);
          setUser(foundUser);
          resolve(true);
        } else {
          console.log("Login failed: user not found or password mismatch");
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
          resolve(false);
        }
      }, 500);
    });
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mslab_current_user');
  };
  
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    // Check if the email already exists
    if (users.some(u => u.email === email)) {
      toast({
        title: "Signup Failed",
        description: "Email already registered. Please use a different email.",
        variant: "destructive",
      });
      return false;
    }
    
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      password,
      role: 'user', // Default role for signup is user
    };
    
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        setUsers(prevUsers => [...prevUsers, newUser]);
        setUser(newUser); // Automatically log in
        resolve(true);
      }, 500);
    });
  };
  
  const updateUserProfile = async (userData: User): Promise<void> => {
    // Update the user in the users array
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userData.id ? userData : u)
    );
    
    // Update the current user if the updated user is the current user
    if (user && user.id === userData.id) {
      setUser(userData);
    }
  };
  
  const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      // Update the user in the users array
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, password: newPassword } : u
        )
      );
      
      // Update the current user's password if the updated user is the current user
      if (user && user.id === userId) {
        setUser(prev => prev ? { ...prev, password: newPassword } : null);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    }
  };
  
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };
  
  const createUser = (userData: Omit<User, "id">) => {
    const newUser: User = {
      id: uuidv4(),
      ...userData
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // Save immediately to localStorage
    try {
      localStorage.setItem('mslab_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Error saving new user to localStorage:", error);
    }
  };
  
  const updateUser = (userData: User) => {
    const updatedUsers = users.map(u => u.id === userData.id ? userData : u);
    setUsers(updatedUsers);
    
    // Update the current user if the updated user is the current user
    if (user && user.id === userData.id) {
      setUser(userData);
      
      // Save immediately to localStorage
      try {
        localStorage.setItem('mslab_current_user', JSON.stringify(userData));
      } catch (error) {
        console.error("Error updating current user in localStorage:", error);
      }
    }
    
    // Save immediately to localStorage
    try {
      localStorage.setItem('mslab_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Error saving updated users to localStorage:", error);
    }
  };
  
  const deleteUser = (userId: string) => {
    // Cannot delete yourself
    if (user && user.id === userId) {
      toast({
        title: "Action Not Allowed",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    
    // Save immediately to localStorage
    try {
      localStorage.setItem('mslab_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error("Error saving users after deletion to localStorage:", error);
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        updateUserProfile,
        updateUserPassword,
        getUserById,
        users,
        setUsers,
        createUser,
        updateUser,
        deleteUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
