import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  users: User[];
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updatedUser: User) => void;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  createUser: (userData: Omit<User, "id">) => Promise<void>;
  deleteUser: (userId: string) => void;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    };

    getSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
        if (error) throw error;
        setUsers(data as User[]);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserProfile = (updatedUser: User) => {
    setUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const createUser = async (userData: Omit<User, "id">) => {
    try {
      // Generate a password if not provided
      const password = userData.password || Math.random().toString(36).slice(-8) + 'A1!';
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          department: userData.department
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from auth creation');
      }

      // Update the profile in the profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          department: userData.department || null,
          role: userData.role,
          profile_image: userData.profileImage || null
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't throw here as the user was created successfully in auth
      }

      // Add to local users list
      const newUser = {
        ...authData.user,
        name: userData.name,
        department: userData.department,
        role: userData.role,
        profileImage: userData.profileImage
      } as User;

      setUsers(prevUsers => [...prevUsers, newUser]);

      // Show password to admin if it was auto-generated
      if (!userData.password) {
        toast.success(`User created successfully. Temporary password: ${password}`);
      }

    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const deleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const refreshCurrentUser = async () => {
    try {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
        // Fetch updated profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', refreshedUser.id)
          .single();

        if (profileData) {
          const updatedUser = {
            ...refreshedUser,
            name: profileData.name,
            department: profileData.department,
            role: profileData.role,
            profileImage: profileData.profile_image
          } as User;
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    users,
    login,
    logout,
    updateUserProfile,
    updateUserPassword,
    createUser,
    deleteUser,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
