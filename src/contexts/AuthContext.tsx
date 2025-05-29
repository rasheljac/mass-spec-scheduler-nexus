import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { User, Profile, CreateUserData } from "../types";

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
  createUser: (userData: CreateUserData) => Promise<void>;
  deleteUser: (userId: string) => void;
  refreshCurrentUser: () => Promise<void>;
  signup: (email: string, password: string, name: string, role?: 'admin' | 'user') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  const createExtendedUser = (supabaseUser: SupabaseUser, profileData?: Profile): User => {
    return {
      ...supabaseUser,
      name: profileData?.name || supabaseUser.email?.split('@')[0] || '',
      role: (profileData?.role as 'admin' | 'user') || 'user',
      department: profileData?.department,
      profileImage: profileData?.profileImage
    };
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session?.user) {
        // Fetch profile data for the user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          const profile: Profile = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as 'admin' | 'user',
            department: profileData.department,
            profileImage: profileData.profile_image
          };
          const extendedUser = createExtendedUser(session.user, profile);
          setUser(extendedUser);
        }
      }
      setIsLoading(false);
    };

    getSession();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      
      if (session?.user) {
        // Fetch profile data for the user
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileData) {
          const profile: Profile = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as 'admin' | 'user',
            department: profileData.department,
            profileImage: profileData.profile_image
          };
          const extendedUser = createExtendedUser(session.user, profile);
          setUser(extendedUser);
        }
      } else {
        setUser(null);
      }
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
        
        // Convert profiles to extended users
        const extendedUsers = data.map(profile => ({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as 'admin' | 'user',
          department: profile.department,
          profileImage: profile.profile_image,
          // Add required Supabase User properties with defaults
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: null,
          confirmation_sent_at: null,
          recovery_sent_at: null,
          email_change_sent_at: null,
          new_email: null,
          invited_at: null,
          action_link: null,
          phone: null,
          new_phone: null,
          last_sign_in_at: null,
          is_anonymous: false
        })) as User[];
        
        setUsers(extendedUsers);
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

  const signup = async (email: string, password: string, name: string, role: 'admin' | 'user' = 'user'): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          role: role
        }
      }
    });
    
    if (error) throw error;
    
    // The profile will be created automatically by the trigger
    // No need to return the data since the interface expects void
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
    // This requires admin privileges, so we'll show an error for now
    throw new Error('Password updates require admin privileges. Please use the Supabase dashboard.');
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      console.log('Creating user with data:', userData);
      
      // Generate a password if not provided
      const password = userData.password || Math.random().toString(36).slice(-8) + 'A1!';
      
      // Use signup instead of admin.createUser
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            department: userData.department
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from auth creation');
      }

      console.log('User created successfully:', authData.user.id);

      // The profile should be created by the trigger, but let's ensure it exists
      // Wait a moment for the trigger to execute
      setTimeout(async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user!.id)
            .single();

          if (profileError || !profileData) {
            // If profile doesn't exist, create it manually
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: authData.user!.id,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                department: userData.department || null,
                profile_image: userData.profileImage || null
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
            }
          } else {
            // Update existing profile with complete data
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                department: userData.department || null,
                profile_image: userData.profileImage || null
              })
              .eq('id', authData.user!.id);

            if (updateError) {
              console.error('Error updating profile:', updateError);
            }
          }

          // Refresh users list
          const { data: allProfiles } = await supabase
            .from('profiles')
            .select('*');
          
          if (allProfiles) {
            const extendedUsers = allProfiles.map(profile => ({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as 'admin' | 'user',
              department: profile.department,
              profileImage: profile.profile_image,
              app_metadata: {},
              user_metadata: {},
              aud: 'authenticated',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              email_confirmed_at: new Date().toISOString(),
              phone_confirmed_at: null,
              confirmation_sent_at: null,
              recovery_sent_at: null,
              email_change_sent_at: null,
              new_email: null,
              invited_at: null,
              action_link: null,
              phone: null,
              new_phone: null,
              last_sign_in_at: null,
              is_anonymous: false
            })) as User[];
            
            setUsers(extendedUsers);
          }
        } catch (error) {
          console.error('Error handling post-creation profile setup:', error);
        }
      }, 1000);

      // Show password to admin if it was auto-generated
      if (!userData.password) {
        toast.success(`User created successfully. Temporary password: ${password}`);
      } else {
        toast.success('User created successfully!');
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
          const profile: Profile = {
            id: profileData.id,
            name: profileData.name,
            email: profileData.email,
            role: profileData.role as 'admin' | 'user',
            department: profileData.department,
            profileImage: profileData.profile_image
          };
          const updatedUser = createExtendedUser(refreshedUser, profile);
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
    signup,
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
