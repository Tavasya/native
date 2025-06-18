import { supabase } from './client';

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
};

export const handleGoogleAuthCallback = async () => {
  try {
    // Get the current user after OAuth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No user found after OAuth');
    }

    // Check if user profile exists in our database
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error('Failed to check user profile');
    }

    // If no profile exists, create one
    if (!existingProfile) {
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Google User',
          email_verified: true,
          auth_provider: 'google',
          profile_complete: false,
          agreed_to_terms: false
        });

      if (createError) {
        throw new Error('Failed to create user profile');
      }

      return { needsOnboarding: true, isNewUser: true };
    }

    // Return whether user needs onboarding
    return { 
      needsOnboarding: !existingProfile.profile_complete,
      isNewUser: false 
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
}; 