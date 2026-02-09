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
        const filePath = `${user.id}/${path}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('documents') // Assuming a 'documents' bucket exists and is private/secure
            .upload(filePath, file);

        if (uploadError) throw uploadError;
        return filePath;
    };

    const handleSubmit = async () => {
        if (!docFront || !selfie || (documentType === 'rg' && !docBack)) {
            setError('Por favor, envie todas as fotos solicitadas.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Upload Document Front
            await uploadFile(docFront, 'document_front');

            // 2. Upload Document Back (if RG)
            if (documentType === 'rg' && docBack) {
                await uploadFile(docBack, 'document_back');
            }

            // 3. Upload Selfie
            await uploadFile(selfie, 'selfie_verification');

            // 4. Update User Metadata status
            const { data, error: updateError } = await supabase.auth.updateUser({
                data: {
                    documents_status: 'submitted',
                    documents_submitted_at: new Date().toISOString()
                }
            });

            if (updateError) throw updateError;

            // 5. Update local state
            setUser({
                ...user,
                user_metadata: {
                    ...user.user_metadata,
                    documents_status: 'submitted'
                }
            });

            // 6. Navigate Back/Success
            onSubmissionSuccess();

        } catch (err: any) {
            console.error('Error submitting documents:', err);
            setError('Erro ao enviar documentos. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

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

const UploadCard = ({ title, desc, file, onSelect, icon }: any) => (
    <div className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${file ? 'border-success bg-success/5' : 'border-border-medium hover:border-accent-primary hover:bg-bg-secondary'}`}>
        <input
            type="file"
            accept="image/*"
            onChange={onSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${file ? 'bg-success/20 text-success' : 'bg-bg-tertiary text-text-tertiary'}`}>
                {file ? <ShieldCheck size={24} /> : icon}
            </div>
            <h4 className="font-bold text-text-primary text-sm">{file ? 'Arquivo Selecionado' : title}</h4>
            <p className="text-xs text-text-tertiary max-w-[200px] mx-auto">
                {file ? file.name : desc}
            </p>
        </div>
    </div>
);

export default DocumentSubmission;
