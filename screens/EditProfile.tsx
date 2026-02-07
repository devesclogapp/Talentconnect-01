import React, { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Camera, Save, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import AvatarUpload from '../components/AvatarUpload';
import { resolveUserAvatar } from '../utils/userUtils';

interface Props {
    user: any;
    onBack: () => void;
    onUpdate: (updatedUser: any) => void;
}

const EditProfile: React.FC<Props> = ({ user, onBack, onUpdate }) => {
    const [name, setName] = useState(user?.user_metadata?.name || '');
    const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase.auth.updateUser({
                data: {
                    name,
                    phone
                }
            });

            if (error) throw error;

            if (data.user) {
                // Update local user state via callback
                onUpdate({ ...user, user_metadata: { ...user.user_metadata, name, phone } });
                onBack();
            }

        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-app-bg animate-fade-in">
            <header className="sticky top-0 z-50 bg-white dark:bg-black border-b border-neutral-100 dark:border-neutral-900 px-4 py-4 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl interactive"
                >
                    <ArrowLeft size={20} className="text-black dark:text-white" />
                </button>
                <h1 className="heading-md uppercase tracking-widest text-xs">Editar Perfil</h1>
                <div className="w-10"></div>
            </header>

            <main className="p-6 max-w-md mx-auto">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-28 h-28 rounded-full border-4 border-white dark:border-neutral-800 shadow-xl overflow-hidden relative group">
                        <AvatarUpload
                            user={user}
                            onUploadComplete={(newUrl) => {
                                // Update local state immediately so user sees the change
                                onUpdate({
                                    ...user,
                                    avatar_url: newUrl,
                                    user_metadata: {
                                        ...user.user_metadata,
                                        avatar_url: newUrl
                                    }
                                });
                            }}
                        >
                            <img
                                src={resolveUserAvatar(user)}
                                alt="Profile"
                                className="w-full h-full object-cover rounded-full"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera size={24} className="text-white" />
                            </div>
                        </AvatarUpload>
                    </div>
                    <p className="mt-4 meta text-text-secondary uppercase tracking-widest text-[10px]">Alterar Foto</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Nome Completo</label>
                        <Input
                            icon={User}
                            placeholder="Seu nome"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Telefone</label>
                        <Input
                            icon={Phone}
                            placeholder="(00) 00000-0000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1 opacity-50 pointer-events-none">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-wider ml-1">Email (Não editável)</label>
                        <Input
                            icon={Mail}
                            value={user?.email || ''}
                            readOnly
                        />
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-900">
                <Button
                    onClick={handleSave}
                    isLoading={loading}
                    className="w-full"
                    leftIcon={<Save size={18} />}
                >
                    Salvar Alterações
                </Button>
            </footer>
        </div>
    );
};

export default EditProfile;
