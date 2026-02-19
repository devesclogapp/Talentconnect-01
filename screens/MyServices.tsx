import React, { useState, useEffect } from 'react';
import { getProviderServices, deleteService, deactivateService, checkServiceHasOrders } from '../services/servicesService';
import { getCurrentUser } from '../services/authService';
import { CATEGORY_MAP, getCategoryImage } from '../constants';
import { Trash2, Edit2, Plus, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
    onBack: () => void;
    onNavigate: (v: string, serviceId?: string) => void;
}

const MyServices: React.FC<Props> = ({ onBack, onNavigate }) => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchMyServices = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            if (user) {
                const data = await getProviderServices(user.id);
                // Filtramos apenas os ativos para que o "soft delete" funcione visualmente
                setServices(data?.filter(s => s.active === true) || []);
            }
        } catch (error) {
            console.error("Erro ao carregar meus serviços:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyServices();
    }, []);

    // Clear feedback after 3 seconds
    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleEdit = (e: React.MouseEvent, serviceId: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Editando serviço:', serviceId);
        onNavigate('SERVICE_REGISTRATION', serviceId);
    };

    const requestDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setServiceToDelete(id);
        setShowConfirm(true);
    };

    const confirmDelete = async () => {
        if (!serviceToDelete) return;

        setShowConfirm(false);
        setLoading(true);

        try {
            // 1. Verifica se há pedidos vinculados
            const hasOrders = await checkServiceHasOrders(serviceToDelete);

            if (hasOrders) {
                console.log("Serviço possui pedidos. Executando Soft Delete para preservar histórico.");
                await deactivateService(serviceToDelete);
                setFeedback({ type: 'success', message: "Serviço com histórico arquivado com sucesso!" });
            } else {
                // 2. Se não tem pedidos, tenta excluir fisicamente
                try {
                    await deleteService(serviceToDelete);
                    console.log("Serviço excluído fisicamente (sem vínculos).");
                    setFeedback({ type: 'success', message: "Serviço removido permanentemente!" });
                } catch (err: any) {
                    console.warn("Falha na deleção física, tentando desativar:", err.message);
                    await deactivateService(serviceToDelete);
                    setFeedback({ type: 'success', message: "Serviço desativado com sucesso." });
                }
            }

            // Atualiza a lista local
            await fetchMyServices();

        } catch (error: any) {
            console.error("Erro crítico ao processar ação de exclusão:", error);
            setFeedback({ type: 'error', message: "Não foi possível processar a solicitação." });
        } finally {
            setLoading(false);
            setServiceToDelete(null);
        }
    };

    return (
        <div className="bg-app-bg min-h-screen pb-24 transition-colors relative">
            <header className="sticky top-0 z-50 bg-bg-primary border-b border-border-subtle px-4 py-6 flex items-center justify-between">
                <button onClick={onBack} className="btn-icon">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="heading-md uppercase tracking-widest text-text-primary">Meus Serviços</h1>
                <button onClick={() => onNavigate('SERVICE_REGISTRATION')} className="btn-icon">
                    <Plus size={20} />
                </button>
            </header>

            <main className="p-4 space-y-4">
                {loading && !services.length ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                        <p className="meta-bold text-text-primary uppercase tracking-widest">Buscando seus serviços...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-bg-secondary rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[32px] text-text-primary">design_services</span>
                        </div>
                        <p className="body text-text-primary">Nenhum serviço cadastrado.</p>
                        <button onClick={() => onNavigate('SERVICE_REGISTRATION')} className="btn-primary">Criar meu primeiro serviço</button>
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="bg-bg-secondary border border-border-subtle p-5 rounded-2xl flex gap-5 active:scale-[0.98] transition-all">
                            <div className="w-24 h-24 rounded-2xl bg-bg-tertiary overflow-hidden shrink-0 border border-border-subtle relative">
                                <img
                                    src={service.image_url || getCategoryImage(service.category)}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = getCategoryImage(service.category);
                                    }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    alt={service.title}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="heading-md text-text-primary truncate pr-2">{service.title}</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => handleEdit(e, service.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-primary text-text-primary border border-border-subtle shadow-md active:scale-90 transition-all hover:border-accent-primary"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => requestDelete(e, service.id)}
                                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-bg-primary text-error border border-border-subtle shadow-md active:scale-90 transition-all hover:bg-error/10 hover:border-error"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="meta !text-[8px] text-text-primary opacity-60 mb-2 truncate">{service.category}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-text-primary">R$ {service.base_price}</span>
                                    <span className="meta !text-[8px] text-text-tertiary">
                                        {service.pricing_mode === 'hourly' ? '/ hora' : '/ unidade'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>

            {/* Custom Modal Overlay */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg-primary w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-border-subtle scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-2">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="heading-md text-text-primary">Excluir Serviço?</h3>
                            <p className="text-sm text-text-tertiary px-2">
                                Tem certeza que deseja remover este serviço? Se houver pedidos antigos, ele será apenas arquivado.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="py-3 px-4 rounded-xl font-bold text-text-primary bg-bg-secondary hover:bg-bg-tertiary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="py-3 px-4 rounded-xl font-bold text-white bg-error hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
                                >
                                    Sim, excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Toast */}
            {feedback && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] animate-in slide-in-from-top-4 duration-300">
                    <div className={`px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border ${feedback.type === 'success'
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-red-500 text-white border-red-600'
                        }`}>
                        <span className="text-sm font-bold tracking-wide">{feedback.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyServices;
