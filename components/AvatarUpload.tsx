import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface AvatarUploadProps {
    user: any;
    children: React.ReactNode;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ user, children }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 1. Upload the file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profiles')
                .getPublicUrl(filePath);

            // 3. Update the user's profile with the new avatar_url
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Refresh page to show new avatar (simple approach)
            window.location.reload();

        } catch (error: any) {
            alert('Error uploading avatar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group cursor-pointer" onClick={() => !uploading && fileInputRef.current?.click()}>
            {children}
            {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-inherit">
                    <Loader2 className="animate-spin text-accent-primary" size={24} />
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
};

export default AvatarUpload;
