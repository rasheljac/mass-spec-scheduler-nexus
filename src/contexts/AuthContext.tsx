
import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { User, Profile, CreateUserData } from "../types";
import { sendEmail } from "../utils/emailNotifications";
import { UserDeletionService } from "../components/admin/user/UserDeletionService";

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
  refreshUsers: () => Promise<void>;
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

  const fetchUsers = async () => {
    try {
      const freshUsers = await UserDeletionService.fetchAllUsers();
      setUsers(freshUsers);
      return freshUsers;
    } catch (error) {
      console.error("AuthContext: Error fetching users:", error);
      throw error;
    }
  };

  const refreshUsers = async () => {
    try {
      console.log('AuthContext: Force refreshing users list from database...');
      const freshUsers = await fetchUsers();
      console.log(`AuthContext: Users list refreshed successfully - ${freshUsers.length} users loaded`);
    } catch (error) {
      console.error('AuthContext: Error refreshing users:', error);
    }
  };

  // Simplified initialization
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Starting initialization...');
        
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: Session error:', sessionError);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          console.log('AuthContext: Initial session:', initialSession?.user?.email || 'none');
          setSession(initialSession);
          
          if (initialSession?.user) {
            try {
              // Fetch profile data
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', initialSession.user.id)
                .single();
              
              const profile: Profile | undefined = profileData ? {
                id: profileData.id,
                name: profileData.name,
                email: profileData.email,
                role: profileData.role as 'admin' | 'user',
                department: profileData.department,
                profileImage: profileData.profile_image
              } : undefined;
              
              const extendedUser = createExtendedUser(initialSession.user, profile);
              setUser(extendedUser);
              console.log('AuthContext: User set:', extendedUser.email);
            } catch (profileError) {
              console.error('AuthContext: Profile fetch error:', profileError);
              // Still create user without profile data
              const extendedUser = createExtendedUser(initialSession.user);
              setUser(extendedUser);
            }
          } else {
            setUser(null);
          }
          
          // Always set loading to false after processing initial session
          setIsLoading(false);
          console.log('AuthContext: Initialization complete');
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state change:', event, session?.user?.email || 'none');
      
      if (!mounted) return;

      setSession(session);
      
      if (session?.user) {
        // Use setTimeout to avoid blocking the auth state change
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const profile: Profile | undefined = profileData ? {
              id: profileData.id,
              name: profileData.name,
              email: profileData.email,
              role: profileData.role as 'admin' | 'user',
              department: profileData.department,
              profileImage: profileData.profile_image
            } : undefined;
            
            const extendedUser = createExtendedUser(session.user, profile);
            setUser(extendedUser);
          } catch (error) {
            console.error('AuthContext: Error fetching profile in auth state change:', error);
            const extendedUser = createExtendedUser(session.user);
            setUser(extendedUser);
          }
        }, 100);
      } else {
        setUser(null);
      }
    });

    // Start initialization
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch users when user becomes admin
  useEffect(() => {
    if (user?.role === 'admin' && !isLoading) {
      fetchUsers();
    }
  }, [user?.role, isLoading]);

  const sendWelcomeEmail = async (email: string, name: string) => {
    try {
      console.log('Sending welcome email to:', email);
      
      const welcomeEmail = {
        to: email,
        subject: `Welcome to Lab Management System, ${name}!`,
        body: `Welcome to our lab management platform!`,
        templateType: "welcome",
        variables: {
          userName: name
        }
      };
      
      const emailSent = await sendEmail(welcomeEmail);
      if (emailSent) {
        console.log('Welcome email sent successfully');
      } else {
        console.log('Welcome email sending failed');
      }
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  };

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
    
    if (data.user) {
      setTimeout(() => {
        sendWelcomeEmail(email, name);
      }, 2000);
    }
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
    throw new Error('Password updates require admin privileges. Please use the Supabase dashboard.');
  };

  const createUser = async (userData: CreateUserData) => {
    try {
      console.log('Creating user with data:', userData);
      
      const password = userData.password || Math.random().toString(36).slice(-8) + 'A1!';
      
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

      setTimeout(() => {
        sendWelcomeEmail(userData.email, userData.name);
      }, 2000);

      setTimeout(async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user!.id)
            .single();

          if (profileError || !profileData) {
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

          await refreshUsers();
        } catch (error) {
          console.error('Error handling post-creation profile setup:', error);
        }
      }, 1000);

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
    console.log('AuthContext: Immediately removing user from local state:', userId);
    setUsers(prevUsers => {
      const filteredUsers = prevUsers.filter(u => u.id !== userId);
      console.log(`AuthContext: Users count updated: ${prevUsers.length} -> ${filteredUsers.length}`);
      return filteredUsers;
    });
  };

  const refreshCurrentUser = async () => {
    try {
      const { data: { user: refreshedUser } } = await supabase.auth.getUser();
      if (refreshedUser) {
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
    refreshUsers,
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
