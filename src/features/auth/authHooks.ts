import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '@/integrations/supabase/client';
import { setUser, clearUser } from './authSlice';
import { UserRole, AuthUser } from './types';

export const useSupabaseAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          // Get user profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.warn('Profile fetch error:', error);
            // If profile doesn't exist, use default values
            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'User'
            };
            dispatch(setUser({ 
              user,
              role: 'student' as UserRole // Default role
            }));
          } else {
            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: profile?.name || session.user.email?.split('@')[0] || 'User'
            };
            dispatch(setUser({ 
              user,
              role: profile?.role as UserRole || 'student'
            }));
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          // Fallback to basic user data
          const user: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'User'
          };
          dispatch(setUser({ 
            user,
            role: 'student' as UserRole
          }));
        }
      } else {
        dispatch(clearUser());
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            // Get user profile data
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.warn('Profile fetch error:', error);
              // If profile doesn't exist, use default values
              const user: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.email?.split('@')[0] || 'User'
              };
              dispatch(setUser({ 
                user,
                role: 'student' as UserRole // Default role
              }));
            } else {
              const user: AuthUser = {
                id: session.user.id,
                email: session.user.email || '',
                name: profile?.name || session.user.email?.split('@')[0] || 'User'
              };
              dispatch(setUser({ 
                user,
                role: profile?.role as UserRole || 'student'
              }));
            }
          } catch (err) {
            console.error('Error fetching profile:', err);
            // Fallback to basic user data
            const user: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.email?.split('@')[0] || 'User'
            };
            dispatch(setUser({ 
              user,
              role: 'student' as UserRole
            }));
          }
        } else if (event === 'SIGNED_OUT') {
          dispatch(clearUser());
        }
      }
    );
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch]);
}; 