
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
    role: 'user',
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
    const storedUsers = localStorage.getItem('mslab_users');
    
    // If there are stored users, but the eddy@kapelczak.com user is missing, add it
    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      const userExists = parsedUsers.some((u: User) => u.email === 'eddy@kapelczak.com');
      
      if (!userExists) {
        // Add the missing user
        parsedUsers.push({
          id: '4',
          name: 'Eddy Kapelczak',
          email: 'eddy@kapelczak.com',
          password: 'Eddie#12',
          role: 'user',
          department: 'Research',
          profileImage: ''
        });
        
        // Update localStorage with the fixed users array
        localStorage.setItem('mslab_users', JSON.stringify(parsedUsers));
        return parsedUsers;
      }
      
      return parsedUsers;
    }
    
    return defaultUsers;
  });
  
  // Initialize user state from localStorage
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('mslab_current_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  // Update localStorage when users change
  useEffect(() => {
    localStorage.setItem('mslab_users', JSON.stringify(users));
  }, [users]);
  
  // Update localStorage when current user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('mslab_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mslab_current_user');
    }
  }, [user]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log(`Login attempt for: ${email} with password: ${password}`);
    console.log(`Available users: ${JSON.stringify(users.map(u => ({ email: u.email, password: u.password })))}`);
    
    // Clear case-sensitivity issues - normalize email for comparison
    const normalizedEmail = email.toLowerCase().trim();
    
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
    setUsers(prevUsers => [...prevUsers, newUser]);
  };
  
  const updateUser = (userData: User) => {
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userData.id ? userData : u)
    );
    
    // Update the current user if the updated user is the current user
    if (user && user.id === userData.id) {
      setUser(userData);
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
    
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
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
