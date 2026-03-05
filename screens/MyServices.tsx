import React, { useState, useEffect } from 'react';
import { getProviderServices, deleteService, deactivateService, activateService, checkServiceHasOrders } from '../services/servicesService';
import { getCurrentUser } from '../services/authService';
import { getCategoryImage } from '../constants';
import { Trash2, Edit2, Plus, ArrowLeft, Pause, Play, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
    onBack: () => void;
    onNavigate: (v: string, serviceId?: string) => void;
}

type ToastType = { type: 'success' | 'error'; message: string };

const MyServices: React.FC<Props> = ({ onBack, onNavigate }) => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
    const [toast, setToast] = useState<ToastType | null>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchMyServices = async () => {
        try {
            setLoading(true);
            const user = await getCurrentUser();
            if (user) {
                const data = await getProviderServices(user.id);
                // Show ALL services (active + paused) so provider can manage them
                setServices(data || []);
            }
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyServices();
    }, []);

    const handleEdit = (e: React.MouseEvent, serviceId: string) => {
        e.preventDefault();
        e.stopPropagation();
        onNavigate('/provider/service-registration', serviceId);
    };

    const handleTogglePause = async (e: React.MouseEvent, service: any) => {
        e.preventDefault();
        e.stopPropagation();
        setTogglingId(service.id);
        try {
            if (service.active) {
                await deactivateService(service.id);
                showToast('success', `"${service.title}" pausado com sucesso.`);
            } else {
                await activateService(service.id);
                showToast('success', `"${service.title}" reativado com sucesso.`);
            }
            await fetchMyServices();
        } catch (err: any) {
            showToast('error', err.message || 'Erro ao alterar status do serviço.');
        } finally {
            setTogglingId(null);
        }
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
            const hasOrders = await checkServiceHasOrders(serviceToDelete);
            if (hasOrders) {
                await deactivateService(serviceToDelete);
                showToast('success', 'Serviço arquivado — histórico de pedidos preservado.');
            } else {
                try {
                    await deleteService(serviceToDelete);
                    showToast('success', 'Serviço removido permanentemente.');
                } catch {
                    await deactivateService(serviceToDelete);
                    showToast('success', 'Serviço desativado com sucesso.');
                }
            }
            await fetchMyServices();
        } catch (error: any) {
            showToast('error', 'Não foi possível remover o serviço.');
        } finally {
            setLoading(false);
            setServiceToDelete(null);
        }
    };

    const activeCount = services.filter(s => s.active).length;
    const pausedCount = services.filter(s => !s.active).length;

    return (
        <div className="bg-app-bg min-h-screen pb-24 transition-colors relative">

            {/* Header */}
            <header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur border-b border-border-subtle px-5 py-4">
                <div className="flex items-center justify-between">
                    <button onClick={onBack} className="btn-icon">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-[11px] font-black tracking-[0.2em] uppercase text-text-primary">Meus Serviços</h1>
                        <p className="text-[9px] text-text-tertiary mt-0.5">
                            {activeCount} ativos · {pausedCount} pausados
                        </p>
                    </div>
                    <button
                        onClick={() => onNavigate('/provider/service-registration')}
                        className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center shadow-glow"
                    >
                        <Plus size={20} className="text-bg-primary" />
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-3">
                {/* Loading */}
                {loading && !services.length ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
                        <p className="text-[10px] font-black tracking-widest text-text-tertiary uppercase animate-pulse">Carregando...</p>
                    </div>
                ) : services.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-8">
                        <div className="w-20 h-20 rounded-3xl bg-bg-secondary border border-border-subtle flex items-center justify-center">
                            <Plus size={32} className="text-text-tertiary" />
                        </div>
                        <div>
                            <h3 className="font-black text-text-primary mb-1">Nenhum serviço ainda</h3>
                            <p className="text-sm text-text-tertiary">Crie seu primeiro serviço para começar a receber pedidos.</p>
                        </div>
                        <button
                            onClick={() => onNavigate('/provider/service-registration')}
                            className="btn-primary"
                        >
                            Criar meu primeiro serviço
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Section: Active */}
                        {activeCount > 0 && (
                            <section>
                                <div className="flex items-center gap-2 px-1 py-3">
                                    <div className="w-2 h-2 rounded-full bg-success" />
                                    <span className="text-[10px] font-black tracking-widest uppercase text-text-tertiary">
                                        Ativos ({activeCount})
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {services.filter(s => s.active).map(service => (
                                        <ServiceItem
                                            key={service.id}
                                            service={service}
                                            isToggling={togglingId === service.id}
                                            onEdit={handleEdit}
                                            onToggle={handleTogglePause}
                                            onDelete={requestDelete}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Section: Paused */}
                        {pausedCount > 0 && (
                            <section>
                                <div className="flex items-center gap-2 px-1 py-3 mt-2">
                                    <div className="w-2 h-2 rounded-full bg-text-tertiary/50" />
                                    <span className="text-[10px] font-black tracking-widest uppercase text-text-tertiary">
                                        Pausados ({pausedCount})
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {services.filter(s => !s.active).map(service => (
                                        <ServiceItem
                                            key={service.id}
                                            service={service}
                                            isToggling={togglingId === service.id}
                                            onEdit={handleEdit}
                                            onToggle={handleTogglePause}
                                            onDelete={requestDelete}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>

            {/* Delete Confirm Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-bg-primary w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-border-subtle animate-slide-up">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
                                <Trash2 size={28} />
                            </div>
                            <div>
                                <h3 className="font-black text-text-primary text-lg">Remover Serviço?</h3>
                                <p className="text-sm text-text-tertiary mt-1 leading-relaxed">
                                    Se houver pedidos vinculados, o serviço será apenas arquivado para preservar o histórico.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="py-3.5 px-4 rounded-2xl font-bold text-text-primary bg-bg-secondary hover:bg-bg-tertiary transition-colors border border-border-subtle"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="py-3.5 px-4 rounded-2xl font-bold text-white bg-error hover:bg-error/90 transition-colors shadow-lg shadow-error/20"
                                >
                                    Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] animate-slide-down">
                    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold max-w-xs ${toast.type === 'success'
                        ? 'bg-bg-primary border-success/30 text-text-primary'
                        : 'bg-bg-primary border-error/30 text-text-primary'
                        }`}>
                        {toast.type === 'success'
                            ? <CheckCircle2 size={18} className="text-success shrink-0" />
                            : <AlertCircle size={18} className="text-error shrink-0" />
                        }
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Service Item Card ─── */
interface ServiceItemProps {
    service: any;
    isToggling: boolean;
    onEdit: (e: React.MouseEvent, id: string) => void;
    onToggle: (e: React.MouseEvent, service: any) => void;
    onDelete: (e: React.MouseEvent, id: string) => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service, isToggling, onEdit, onToggle, onDelete }) => {
    const isActive = service.active;

    return (
        <div className={`rounded-3xl border overflow-hidden transition-all duration-300 ${isActive
            ? 'bg-bg-secondary border-border-subtle'
            : 'bg-bg-secondary/50 border-border-subtle/50 opacity-70'
            }`}>
            {/* Image + Info row */}
            <div className="flex gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 bg-bg-tertiary">
                    <img
                        src={service.image_url || getCategoryImage(service.category)}
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = getCategoryImage(service.category);
                        }}
                        className={`w-full h-full object-cover transition-all ${!isActive ? 'grayscale' : ''}`}
                        alt={service.title}
                    />
                    {/* Paused overlay */}
                    {!isActive && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Pause size={18} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-text-primary leading-snug line-clamp-2 flex-1">
                            {service.title}
                        </h3>
                        {/* Status badge */}
                        <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${isActive
                            ? 'bg-success/10 text-success'
                            : 'bg-text-tertiary/10 text-text-tertiary'
                            }`}>
                            {isActive ? 'Ativo' : 'Pausado'}
                        </span>
                    </div>

                    <p className="text-[10px] text-text-tertiary mt-1 mb-2">{service.category}</p>

                    <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-text-primary">
                            R$ {Number(service.base_price).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                            {service.pricing_mode === 'hourly' ? '/ hora' : '/ unidade'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-border-subtle/50 flex divide-x divide-border-subtle/50">
                {/* Pause / Resume */}
                <button
                    onClick={(e) => onToggle(e, service)}
                    disabled={isToggling}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold transition-colors active:scale-95 ${isActive
                        ? 'text-warning hover:bg-warning/5'
                        : 'text-success hover:bg-success/5'
                        } disabled:opacity-50`}
                >
                    {isToggling ? (
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    ) : isActive ? (
                        <><Pause size={15} /><span>Pausar</span></>
                    ) : (
                        <><Play size={15} /><span>Reativar</span></>
                    )}
                </button>

                {/* Edit */}
                <button
                    onClick={(e) => onEdit(e, service.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold text-text-secondary hover:bg-accent-primary/5 hover:text-accent-primary transition-colors active:scale-95"
                >
                    <Edit2 size={15} />
                    <span>Editar</span>
                </button>

                {/* Delete */}
                <button
                    onClick={(e) => onDelete(e, service.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-bold text-error/70 hover:bg-error/5 hover:text-error transition-colors active:scale-95"
                >
                    <Trash2 size={15} />
                    <span>Remover</span>
                </button>
            </div>
        </div>
    );
};

export default MyServices;
