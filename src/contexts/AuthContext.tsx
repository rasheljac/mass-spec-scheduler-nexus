import React, { createContext, useState, useContext, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '../types';
import { useToast } from '../hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; 
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

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
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
  
  // State for users and current user
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Function to refresh the users list (for admin purposes)
  const refreshUsersList = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error loading users",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data) {
        const formattedUsers: User[] = data.map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as 'admin' | 'user',
          department: profile.department || '',
          profileImage: profile.profile_image || '',
          password: ''
        }));
        
        setUsers(formattedUsers);
      }
    } catch (e) {
      console.error('Error refreshing users list:', e);
    }
  };

  // Function to refresh current user data
  const refreshCurrentUser = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error refreshing current user:', error);
        return;
      }
      
      if (profile) {
        const userData: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role as 'admin' | 'user',
          department: profile.department || '',
          profileImage: profile.profile_image || '',
          password: ''
        };
        
        setUser(userData);
        console.log("User refreshed with new profile image:", userData.profileImage);
      }
    } catch (e) {
      console.error('Error refreshing current user:', e);
    }
  };

  // Initialize by loading data from Supabase on initialization
  useEffect(() => {
    console.log("AuthProvider initializing...");
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("Checking for existing session...");
        
        // Get the current session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log("Initial session check:", initialSession ? "Session found" : "No session");
        
        if (initialSession && isMounted) {
          setSession(initialSession);
          
          // Get user profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching initial profile:', error);
          } else if (profile && isMounted) {
            const userData: User = {
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as 'admin' | 'user',
              department: profile.department || '',
              profileImage: profile.profile_image || '',
              password: ''
            };
            
            setUser(userData);
            console.log("Initial user set:", userData.email);
          }
        }
        
        // Load users for admin purposes
        if (isMounted) {
          await refreshUsersList();
        }
      } catch (e) {
        console.error('Error in auth initialization:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
          setAuthInitialized(true);
          console.log("Auth initialization complete");
        }
      }
    };
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        if (!isMounted) return;
        
        setSession(currentSession);
        
        if (currentSession) {
          try {
            // Get user profile from database
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile:', error);
              if (isMounted) setLoading(false);
              return;
            }
            
            if (profile) {
              // Convert Supabase profile to our User type
              const userData: User = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role as 'admin' | 'user',
                department: profile.department || '',
                profileImage: profile.profile_image || '',
                password: ''
              };
              
              if (isMounted) {
                setUser(userData);
                console.log("User set:", userData.email);
                setLoading(false);
              }
            } else {
              console.log('No profile found for user');
              if (isMounted) {
                setUser(null);
                setLoading(false);
              }
            }
          } catch (e) {
            console.error('Error in auth state change handler:', e);
            if (isMounted) {
              setLoading(false);
            }
          }
        } else {
          if (isMounted) {
            setUser(null);
            setLoading(false);
            console.log("No session, auth loading complete");
          }
        }
      }
    );
    
    // Run initial session check
    initializeAuth();
    
    // Cleanup subscription and set mounted flag
    return () => {
      console.log("Auth provider cleanup");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Debug logs for authentication state
  useEffect(() => {
    console.log("Auth state updated - Loading:", loading, "User:", user?.email, "Authenticated:", !!user, "Initialized:", authInitialized);
  }, [loading, user, authInitialized]);
  
  // Migration logic - kept unchanged
  useEffect(() => {
    const migrateLocalStorageUsers = async () => {
      // Check if migration has been done
      const migrationDone = localStorage.getItem('mslab_migration_done');
      if (migrationDone === 'true') {
        console.log('Migration already completed');
        return;
      }
      
      try {
        // Get users from localStorage
        const storedUsers = localStorage.getItem('mslab_users');
        if (!storedUsers) {
          console.log('No users to migrate');
          localStorage.setItem('mslab_migration_done', 'true');
          return;
        }
        
        const localUsers: User[] = JSON.parse(storedUsers);
        console.log('Migrating local users:', localUsers);
        
        // Migrate each user
        for (const localUser of localUsers) {
          // Check if user already exists in Supabase
          const { data: existingUsers, error: checkError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', localUser.email);
          
          if (checkError) {
            console.error('Error checking for existing user:', checkError);
            continue;
          }
          
          // Skip if user already exists
          if (existingUsers && existingUsers.length > 0) {
            console.log(`User ${localUser.email} already exists in Supabase, skipping`);
            continue;
          }
          
          // Create auth user in Supabase
          const { data: authData, error: signupError } = await supabase.auth.signUp({
            email: localUser.email,
            password: localUser.password,
            options: {
              data: {
                name: localUser.name,
              }
            }
          });
          
          if (signupError) {
            console.error(`Error creating auth user ${localUser.email}:`, signupError);
            continue;
          }
          
          console.log(`Created auth user for ${localUser.email}`);
          
          // The trigger should create the profile automatically
          // But we'll update it with additional info
          if (authData.user) {
            // Wait a bit for the trigger to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update with additional info
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                department: localUser.department || null,
                role: localUser.role,
                profile_image: localUser.profileImage || null
              })
              .eq('id', authData.user.id);
            
            if (updateError) {
              console.error(`Error updating profile for ${localUser.email}:`, updateError);
            } else {
              console.log(`Updated profile for ${localUser.email}`);
            }
          }
        }
        
        // Mark migration as done
        localStorage.setItem('mslab_migration_done', 'true');
        console.log('Migration completed');
        
        // Refresh users list after migration
        await refreshUsersList();
        
        toast({
          title: "User Migration Complete",
          description: "User data has been migrated to Supabase",
        });
      } catch (e) {
        console.error('Migration error:', e);
        toast({
          title: "Migration Error",
          description: "There was an error migrating user data",
          variant: "destructive",
        });
      }
    };
    
    // Run migration after a short delay to ensure Supabase is connected
    const timer = setTimeout(() => {
      migrateLocalStorageUsers();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log(`Login attempt for: ${email}`);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return false;
      }
      
      if (data.user) {
        console.log('Login successful');
        // State will be updated by the auth state change listener
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (e) {
      console.error('Unexpected login error:', e);
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setLoading(false);
      return false;
    }
  };
  
  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error.message);
        toast({
          title: "Logout Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      setUser(null);
      setSession(null);
    } catch (e) {
      console.error('Unexpected logout error:', e);
    } finally {
      setLoading(false);
    }
  };
  
  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Check if email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email);
      
      if (checkError) {
        console.error('Error checking existing users:', checkError);
        toast({
          title: "Signup Error",
          description: "Could not verify email availability",
          variant: "destructive",
        });
        return false;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Signup Failed",
          description: "Email already registered",
          variant: "destructive",
        });
        return false;
      }
      
      // Create the new user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error.message);
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (data.user) {
        console.log('Signup successful');
        toast({
          title: "Signup Successful",
          description: "Your account has been created",
        });
        
        // Refresh users list after signup
        await refreshUsersList();
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Unexpected signup error:', e);
      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const updateUserProfile = async (userData: User): Promise<void> => {
    try {
      // Update the profile in Supabase using the correct field name
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          department: userData.department || null,
          profile_image: userData.profileImage || null
        })
        .eq('id', userData.id);
      
      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Profile Update Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update the local users array
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      
      // Update the current user if it's the same user
      if (user && user.id === userData.id) {
        setUser(userData);
        console.log("Current user updated with new profile image:", userData.profileImage);
      }
      
      // Refresh current user data to ensure consistency
      await refreshCurrentUser(userData.id);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (e) {
      console.error('Unexpected error updating profile:', e);
      toast({
        title: "Profile Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const updateUserPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      // For security, only allow users to change their own password
      // or admins to reset passwords
      if (user?.id !== userId && user?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to change this password",
          variant: "destructive",
        });
        return false;
      }
      
      // Currently, Supabase only supports users changing their own password
      // For admin password resets, we'd need a server-side function
      // For simplicity, we'll implement just the self-password change
      if (userId === user?.id) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (error) {
          console.error('Error updating password:', error);
          toast({
            title: "Password Update Failed",
            description: error.message,
            variant: "destructive",
          });
          return false;
        }
        
        toast({
          title: "Password Updated",
          description: "Your password has been updated successfully",
        });
        return true;
      } else {
        // For admin password resets - this would require a server function
        // Just showing a message for now
        toast({
          title: "Admin Password Reset",
          description: "Admin password resets require a server function (not implemented in this demo)",
        });
        return false;
      }
    } catch (e) {
      console.error('Unexpected error updating password:', e);
      toast({
        title: "Password Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };
  
  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };
  
  const createUser = async (userData: Omit<User, "id">) => {
    try {
      // Admin function to create a new user
      if (user?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can create users",
          variant: "destructive",
        });
        return;
      }
      
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password || Math.random().toString(36).slice(-8), // Random password if none provided
        email_confirm: true,
        user_metadata: {
          name: userData.name,
        }
      });
      
      if (error) {
        console.error('Error creating user:', error);
        toast({
          title: "User Creation Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      if (data.user) {
        // Update additional profile fields
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            department: userData.department || null,
            role: userData.role,
            profile_image: userData.profileImage || null
          })
          .eq('id', data.user.id);
        
        if (updateError) {
          console.error('Error updating new user profile:', updateError);
        }
        
        // Refresh the users list
        await refreshUsersList();
        
        toast({
          title: "User Created",
          description: `User ${userData.name} has been created successfully`,
        });
      }
    } catch (e) {
      console.error('Unexpected error creating user:', e);
      toast({
        title: "User Creation Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const updateUser = async (userData: User) => {
    try {
      // This is an admin function
      if (user?.role !== 'admin' && user?.id !== userData.id) {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to update this user",
          variant: "destructive",
        });
        return;
      }
      
      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          email: userData.email,
          department: userData.department || null,
          role: userData.role,
          profile_image: userData.profileImage || null
        })
        .eq('id', userData.id);
      
      if (error) {
        console.error('Error updating user:', error);
        toast({
          title: "User Update Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update the local users array
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      
      // Update the current user if it's the same user
      if (user && user.id === userData.id) {
        setUser(userData);
      }
      
      toast({
        title: "User Updated",
        description: `User ${userData.name} has been updated successfully`,
      });
    } catch (e) {
      console.error('Unexpected error updating user:', e);
      toast({
        title: "User Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      // This is an admin function
      if (user?.role !== 'admin') {
        toast({
          title: "Permission Denied",
          description: "Only admins can delete users",
          variant: "destructive",
        });
        return;
      }
      
      // Cannot delete yourself
      if (user.id === userId) {
        toast({
          title: "Action Not Allowed",
          description: "You cannot delete your own account",
          variant: "destructive",
        });
        return;
      }
      
      // Delete the user from Supabase Auth
      // Note: This requires admin access and typically should be
      // done through a secure server function
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "User Deletion Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update the local users array
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
    } catch (e) {
      console.error('Unexpected error deleting user:', e);
      toast({
        title: "User Deletion Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: loading, 
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
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-lg font-medium">Loading...</p>
            <p className="text-sm text-muted-foreground">Setting up your application</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
