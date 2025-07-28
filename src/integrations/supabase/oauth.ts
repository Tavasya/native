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
      console.error('🔍 No user found after OAuth:', userError);
      throw new Error('No user found after OAuth');
    }

    // 🔍 DEBUG: Log the complete Google user data
    console.log('🔍 ===== GOOGLE OAUTH DEBUG START =====');
    console.log('🔍 Complete Google User Object:', user);
    console.log('🔍 User ID:', user.id);
    console.log('🔍 User Email:', user.email);
    console.log('🔍 User Metadata:', user.user_metadata);
    console.log('🔍 Raw user_metadata.full_name:', user.user_metadata?.full_name);
    console.log('🔍 Raw user_metadata.first_name:', user.user_metadata?.first_name);
    console.log('🔍 Raw user_metadata.last_name:', user.user_metadata?.last_name);
    console.log('🔍 Raw user_metadata.name:', user.user_metadata?.name);
    console.log('🔍 Email username (fallback):', user.email?.split('@')[0]);

    // Check if user profile exists in our database
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('🔍 Profile check error:', profileError);
      throw new Error('Failed to check user profile');
    }

    // If no profile exists, create one
    if (!existingProfile) {
      // 🔍 IMPROVED: Better name extraction logic
      const extractedName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'Google User';
      
      // 🔍 DEBUG: Log the improved name extraction process
      console.log('🔍 ===== IMPROVED NAME EXTRACTION DEBUG =====');
      console.log('🔍 Step 1 - Check full_name:', user.user_metadata?.full_name);
      console.log('🔍 Step 2 - Check name:', user.user_metadata?.name);
      console.log('🔍 Step 3 - Check email username:', user.email?.split('@')[0]);
      console.log('🔍 Step 4 - Final extracted name:', extractedName);
      console.log('🔍 Name extraction priority:', {
        hasFullName: !!user.user_metadata?.full_name,
        hasName: !!user.user_metadata?.name,
        hasEmail: !!user.email,
        fallbackUsed: !user.user_metadata?.full_name && !user.user_metadata?.name && !!user.email,
        defaultUsed: !user.user_metadata?.full_name && !user.user_metadata?.name && !user.email
      });

      const insertData = {
        id: user.id,
        email: user.email,
        name: extractedName,
        email_verified: true,
        auth_provider: 'google',
        profile_complete: false,
        agreed_to_terms: false
      };

      console.log('🔍 ===== DATABASE INSERT DEBUG =====');
      console.log('🔍 Data being inserted:', insertData);

      const { error: createError } = await supabase
        .from('users')
        .insert(insertData);

      if (createError) {
        console.error('🔍 Database insert error:', createError);
        throw new Error('Failed to create user profile');
      }

      // 🔍 DEBUG: Verify the name was saved by fetching it back
      console.log('🔍 ===== VERIFICATION DEBUG =====');
      const { data: verifyProfile, error: verifyError } = await supabase
        .from('users')
        .select('name, email, auth_provider')
        .eq('id', user.id)
        .single();
      
      if (verifyError) {
        console.error('🔍 Verification fetch error:', verifyError);
      } else {
        console.log('🔍 Profile saved successfully:', verifyProfile);
        console.log('🔍 Saved name matches extracted name:', verifyProfile.name === extractedName);
        console.log('🔍 Auth provider correctly set to:', verifyProfile.auth_provider);
      }

      console.log('🔍 ===== GOOGLE OAUTH DEBUG END =====');
      return { needsOnboarding: true, isNewUser: true };
    }

    // 🔍 NEW: Update existing profile if it's missing Google name data
    if (existingProfile && existingProfile.auth_provider === 'email' && !existingProfile.name) {
      console.log('🔍 ===== UPDATING EXISTING PROFILE WITH GOOGLE DATA =====');
      
      // Extract name from Google metadata
      const extractedName = user.user_metadata?.full_name || 
                           user.user_metadata?.name || 
                           user.email?.split('@')[0] || 
                           'Google User';
      
      console.log('🔍 Updating existing profile with name:', extractedName);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: extractedName,
          auth_provider: 'google',
          email_verified: true
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('🔍 Profile update error:', updateError);
      } else {
        console.log('🔍 Existing profile updated successfully with Google name');
      }
    }

    // 🔍 DEBUG: Log existing profile
    console.log('🔍 ===== EXISTING PROFILE DEBUG =====');
    console.log('🔍 Existing Profile Found:', {
      id: existingProfile.id,
      name: existingProfile.name,
      email: existingProfile.email,
      auth_provider: existingProfile.auth_provider,
      profile_complete: existingProfile.profile_complete
    });
    console.log('🔍 ===== GOOGLE OAUTH DEBUG END =====');

    // Return whether user needs onboarding
    return { 
      needsOnboarding: !existingProfile.profile_complete,
      isNewUser: false 
    };
  } catch (error) {
    console.error('🔍 OAuth callback error:', error);
    throw error;
  }
}; 