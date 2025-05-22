
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (userData: Partial<User>) => Promise<void>;
  updateUserInStorage: (updatedUser: User) => void;
  updateCurrentUser: (updatedUser: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS: User[] = [
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
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem("mslab_users");
    return savedUsers ? JSON.parse(savedUsers) : MOCK_USERS;
  });

  useEffect(() => {
    // Check for stored user on initial load
    const storedUser = localStorage.getItem("mslab_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mslab_users", JSON.stringify(users));
  }, [users]);

  // Function to update a user in the storage
  const updateUserInStorage = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem("mslab_users", JSON.stringify(updatedUsers));
    
    // If the logged in user was updated, update the session too
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      localStorage.setItem("mslab_user", JSON.stringify(updatedUser));
    }
  };

  // Function to update the current user
  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("mslab_user", JSON.stringify(updatedUser));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find the user (using our updated users state)
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser && password === "password") { // Simple password check for demo
      setUser(foundUser);
      localStorage.setItem("mslab_user", JSON.stringify(foundUser));
    } else {
      throw new Error("Invalid credentials");
    }
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      throw new Error("User already exists");
    }

    // In a real app, would create the user via API
    const newUser: User = {
      id: `${users.length + 1}`,
      name,
      email,
      role: "user"
    };

    // Add to our users array and update localStorage
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    
    // Log in the new user
    setUser(newUser);
    localStorage.setItem("mslab_user", JSON.stringify(newUser));
    setIsLoading(false);
  };

  const updateUserProfile = async (userData: Partial<User>) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (user) {
      // Update the user data
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update in users array
      const userIndex = users.findIndex(u => u.id === user.id);
      if (userIndex >= 0) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = updatedUser;
        setUsers(updatedUsers);
      }
      
      // Update in local storage
      localStorage.setItem("mslab_user", JSON.stringify(updatedUser));
      localStorage.setItem("mslab_users", JSON.stringify(users));
    }
    
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mslab_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUserProfile,
        updateUserInStorage,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
