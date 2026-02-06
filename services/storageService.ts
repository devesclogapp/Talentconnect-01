import { supabase } from './supabaseClient';

/**
 * Uploads an avatar image to the 'avatars' bucket.
 * The file is stored in a folder named with the userId.
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    // Generate a unique filename or use a standard one (e.g., avatar.png)
    // We'll use the timestamp to avoid cache issues
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
            upsert: true
        });

    if (uploadError) {
        throw uploadError;
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return publicUrl;
};
