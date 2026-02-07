import React, { useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { uploadAvatar } from '../services/storageService';

interface AvatarUploadProps {
    user: any;
    children: React.ReactNode;
    onUploadComplete?: (newUrl: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ user, children, onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const userId = user.id;

            // 1. Upload to Storage
            const publicUrl = await uploadAvatar(file, userId);

            // 2. Update Auth Metadata (Session persistence)
            const { error: authError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            if (authError) throw authError;

            // 3. Update Public Users Table (Relationships)
            const { error: dbError } = await supabase
                .from('users')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);

            if (dbError) {
                console.warn("Could not update public users table, but auth is updated.", dbError);
            }

            // 4. Callback to update UI immediately
            if (onUploadComplete) {
                onUploadComplete(publicUrl);
            } else {
                // Fallback if no callback provided (e.g. legacy usage)
                window.location.reload();
            }

        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            alert('Erro ao enviar imagem: ' + error.message);
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className="relative group cursor-pointer w-full h-full"
            onClick={() => !uploading && fileInputRef.current?.click()}
        >
            {children}

            {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[inherit] z-50">
                    <Loader2 className="animate-spin text-white" size={24} />
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={uploading}
            />
        </div>
    );
};

export default AvatarUpload;
