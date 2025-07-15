import { supabase } from '@/integrations/supabase/client';

export const uploadScreenshotToSupabase = async (base64Data: string): Promise<string | null> => {
  try {
    // Convert base64 to blob
    const response = await fetch(base64Data);
    const blob = await response.blob();
    
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const filename = `screenshot-${timestamp}-${random}.jpg`;
    
    // Get current user for organizing files
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'anonymous';
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('support-screenshots')
      .upload(`${userId}/${filename}`, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error uploading screenshot to Supabase:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('support-screenshots')
      .getPublicUrl(data.path);

    console.log('Screenshot uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in screenshot upload process:', error);
    return null;
  }
};