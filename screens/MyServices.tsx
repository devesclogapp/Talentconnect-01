import React, { useState, useEffect } from 'react';
import { getProviderServices, deleteService } from '../services/servicesService';
import { getCurrentUser } from '../services/authService';
import { CATEGORY_MAP } from '../constants';
import { Trash2, Edit2, Plus, ArrowLeft, Loader2 } from 'lucide-react';

interface Props {
    onBack: () => void;
    onNavigate: (v: string, serviceId?: string) => void;
}

const MyServices: React.FC<Props> = ({ onBack, onNavigate }) => {
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleEdit = (e: React.MouseEvent, serviceId: string) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Editando serviço:', serviceId);
        onNavigate('SERVICE_REGISTRATION', serviceId);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (window.confirm("Deseja realmente excluir este serviço? Se houver pedidos vinculados, ele será apenas desativado para novos clientes.")) {
            try {
                setLoading(true);

                // Tenta deleção física (API REST regular)
                try {
                    await deleteService(id);
                    console.log("Serviço excluído fisicamente.");
                } catch (err: any) {
                    // Se falhar (ex: erro de ForeignKey/integridade), tentamos desativar
                    console.warn("Falha na deleção física, tentando desativar:", err.message);
                    const { deactivateService } = await import('../services/servicesService');
                    await deactivateService(id);
                    console.log("Serviço desativado com sucesso.");
                }

                // Atualiza a lista local chamando a função de fetch
                await fetchMyServices();
                alert("Operação realizada com sucesso!");

            } catch (error: any) {
                console.error("Erro crítico ao processar ação de exclusão:", error);
                alert("Não foi possível processar a solicitação: " + (error.message || "Erro de conexão"));
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="bg-app-bg min-h-screen pb-24 transition-colors">
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
                {loading ? (
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
                            <div className="w-24 h-24 rounded-2xl bg-bg-tertiary bg-cover bg-center shrink-0 border border-border-subtle"
                                style={{ backgroundImage: `url(${service.image_url || CATEGORY_MAP[service.category]?.image || `https://picsum.photos/seed/${service.id}/200/200`})` }}></div>
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
                                            onClick={(e) => handleDelete(e, service.id)}
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
        </div>
    );
};

export default MyServices;
