import React, { useState } from 'react';
import { ArrowLeft, Upload, FileText, Camera, Send, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAppStore } from '../store';

interface Props {
    onBack: () => void;
    onSubmissionSuccess: () => void;
}

const DocumentSubmission: React.FC<Props> = ({ onBack, onSubmissionSuccess }) => {
    const { user, setUser } = useAppStore();
    const [documentType, setDocumentType] = useState<'chn' | 'rg'>('chn');
    const [docFront, setDocFront] = useState<File | null>(null);
    const [docBack, setDocBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('O arquivo deve ter no máximo 5MB.');
                return;
            }
            if (type === 'front') setDocFront(file);
            if (type === 'back') setDocBack(file);
            if (type === 'selfie') setSelfie(file);
            setError('');
        }
    };

    const uploadFile = async (file: File, path: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        // Path structure: userid/type/filename
        const filePath = `${user.id}/${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;
        return filePath;
    };

    const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);

    // ... handleFileSelect remains the same ...

    const handleSubmit = async () => {
        if (!docFront || !selfie || (documentType === 'rg' && !docBack)) {
            setError('Por favor, envie todas as fotos solicitadas.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const paths: Record<string, string> = {};
            const tryUpload = async (file: File, p: string, key: string) => {
                const filePath = await uploadFile(file, p);
                paths[key] = filePath;
            };

            await tryUpload(docFront, 'document_front', 'doc_front_path');
            if (documentType === 'rg' && docBack) {
                await tryUpload(docBack, 'document_back', 'doc_back_path');
            }
            await tryUpload(selfie, 'selfie_verification', 'selfie_path');

            const metadataUpdates = {
                documents_status: 'submitted',
                documents_submitted_at: new Date().toISOString(),
                ...paths
            };

            const { error: updateError } = await supabase.auth.updateUser({
                data: metadataUpdates
            });

            if (updateError) throw updateError;

            await (supabase.from('provider_profiles') as any).update({
                ...paths,
                documents_status: 'submitted'
            }).eq('user_id', user.id);

            setUser({
                ...user,
                user_metadata: {
                    ...(user as any).user_metadata,
                    ...metadataUpdates
                }
            } as any);

            setSubmittedSuccessfully(true);
            setTimeout(() => {
                onSubmissionSuccess();
            }, 3000);

        } catch (err: any) {
            console.error('Error submitting verification:', err);
            setError('Erro ao processar verificação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (submittedSuccessfully) {
        return (
            <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <ShieldCheck size={48} />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">Documentos Enviados!</h2>
                <p className="text-text-secondary mb-8 max-w-xs mx-auto">
                    Sua identificação foi recebida com sucesso. Nossa equipe analisará os dados em até 24 horas úteis.
                </p>
                <div className="w-full max-w-xs bg-bg-secondary h-1.5 rounded-full overflow-hidden">
                    <div className="bg-success h-full animate-progress-fast" />
                </div>
                <p className="text-[10px] text-text-tertiary mt-4 uppercase tracking-widest font-black">
                    Redirecionando para o perfil...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary animate-fade-in pb-20">
            <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-md border-b border-border-subtle px-4 py-4 flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-bg-secondary hover:bg-bg-tertiary transition-colors text-text-primary"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-text-primary leading-tight">Verificação de Identidade</h1>
                    <p className="text-[11px] text-text-tertiary font-normal">
                        Segurança para todos na plataforma
                    </p>
                </div>
            </header>

            <main className="p-6 max-w-lg mx-auto">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 mb-8 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-blue-600 mb-1">Por que precisamos disso?</h3>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            Para garantir que todos os usuários são reais e criar um ambiente seguro de contratação. Seus documentos são encriptados e usados apenas para verificação.
                        </p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Document Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-3">Tipo de Documento</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setDocumentType('chn')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${documentType === 'chn'
                                    ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                                    : 'border-border-subtle bg-bg-secondary text-text-tertiary hover:border-border-medium'
                                    }`}
                            >
                                CNH (Carteira Motorista)
                            </button>
                            <button
                                onClick={() => setDocumentType('rg')}
                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium ${documentType === 'rg'
                                    ? 'border-accent-primary bg-accent-primary/5 text-accent-primary'
                                    : 'border-border-subtle bg-bg-secondary text-text-tertiary hover:border-border-medium'
                                    }`}
                            >
                                RG (Identidade)
                            </button>
                        </div>
                    </div>

                    {/* Upload Sections */}
                    <div className="space-y-6">
                        <UploadCard
                            title="Frente do Documento"
                            desc="Foto nítida da frente, sem reflexos"
                            file={docFront}
                            onSelect={(e) => handleFileSelect(e, 'front')}
                            icon={<FileText size={24} />}
                        />

                        {documentType === 'rg' && (
                            <UploadCard
                                title="Verso do Documento"
                                desc="Foto nítida do verso com o QR Code (se houver)"
                                file={docBack}
                                onSelect={(e) => handleFileSelect(e, 'back')}
                                icon={<FileText size={24} />}
                            />
                        )}

                        <UploadCard
                            title="Selfie de Confirmação"
                            desc="Apareça segurando seu documento ao lado do rosto"
                            file={selfie}
                            onSelect={(e) => handleFileSelect(e, 'selfie')}
                            icon={<Camera size={24} />}
                        />
                    </div>

                    {error && (
                        <div className="bg-error/10 text-error text-sm p-4 rounded-xl flex items-center gap-2 animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="btn-primary w-full py-4 text-base rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Enviando...
                            </>
                        ) : (
                            <>
                                Enviar para Análise <Send size={18} />
                            </>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
};

const UploadCard = ({ title, desc, file, onSelect, icon }: any) => {
    const [preview, setPreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, [file]);

    return (
        <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all min-h-[160px] flex flex-col justify-center ${file ? 'border-success bg-success/5' : 'border-border-medium hover:border-accent-primary hover:bg-bg-secondary'}`}>
            <input
                type="file"
                accept="image/*"
                onChange={onSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {preview ? (
                <div className="flex flex-col items-center gap-3 animate-fade-in">
                    <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-success shadow-lg">
                        <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                    <div className="flex flex-col items-center">
                        <h4 className="font-bold text-success text-sm flex items-center gap-1">
                            <ShieldCheck size={16} /> Arquivo Pronto
                        </h4>
                        <p className="text-[10px] text-text-tertiary truncate max-w-[150px]">{file.name}</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 bg-bg-tertiary text-text-tertiary`}>
                        {icon}
                    </div>
                    <h4 className="font-bold text-text-primary text-sm">{title}</h4>
                    <p className="text-xs text-text-tertiary max-w-[200px] mx-auto leading-tight">
                        {desc}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DocumentSubmission;
