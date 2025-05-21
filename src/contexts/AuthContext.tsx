
import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
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

  useEffect(() => {
    // Check for stored user on initial load
    const storedUser = localStorage.getItem("mslab_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find the user (in a real app, this would be an API call)
    const foundUser = MOCK_USERS.find(u => u.email === email);
    
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
    if (MOCK_USERS.some(u => u.email === email)) {
      throw new Error("User already exists");
    }

    // In a real app, would create the user via API
    const newUser: User = {
      id: `${MOCK_USERS.length + 1}`,
      name,
      email,
      role: "user"
    };

    // Simulate adding to database
    MOCK_USERS.push(newUser);
    
    // Log in the new user
    setUser(newUser);
    localStorage.setItem("mslab_user", JSON.stringify(newUser));
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
        logout
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
