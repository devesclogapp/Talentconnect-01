import React, { useState, useEffect } from 'react';
import { getProviderServices, deleteService } from '../services/servicesService';
import { getCurrentUser } from '../services/authService';

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
                setServices(data || []);
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

        if (window.confirm("Tem certeza que deseja remover este serviço?")) {
            try {
                console.log('Deletando serviço:', id);
                await deleteService(id);
                setServices(prev => prev.filter(s => s.id !== id));
                alert("Serviço excluído com sucesso!");
            } catch (error) {
                console.error("Erro ao deletar serviço:", error);
                alert("Erro ao deletar serviço.");
            }
        }
    };

    return (
        <div className="bg-app-bg min-h-screen pb-24 transition-colors">
            <header className="sticky top-0 z-50 bg-card-bg border-b border-gray-100 dark:border-zinc-800 px-2 py-4 flex items-center justify-between">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-app-text">
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <h1 className="heading-md uppercase tracking-widest">Meus Serviços</h1>
                <button onClick={() => onNavigate('SERVICE_REGISTRATION')} className="w-10 h-10 flex items-center justify-center text-brand-primary">
                    <span className="material-symbols-outlined">add_circle</span>
                </button>
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="text-center py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                        <p className="meta-bold text-app-text-muted uppercase tracking-widest">Buscando seus serviços...</p>
                    </div>
                ) : services.length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        <span className="material-symbols-outlined text-[48px] mb-2">design_services</span>
                        <p>Nenhum serviço cadastrado.</p>
                        <button onClick={() => onNavigate('SERVICE_REGISTRATION')} className="text-brand-primary label-semibold mt-2">Criar meu primeiro serviço</button>
                    </div>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="bg-card-bg border border-gray-100 dark:border-zinc-800 p-4 rounded-2xl flex gap-4">
                            <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-zinc-800 bg-cover bg-center shrink-0"
                                style={{ backgroundImage: `url(${service.image_url || `https://picsum.photos/seed/${service.id}/200/200`})` }}></div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="body-bold text-app-text leading-tight">{service.title}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleEdit(e, service.id)}
                                            className="text-brand-primary  transition-colors p-1"
                                            title="Editar serviço"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, service.id)}
                                            className="text-red-500  transition-colors p-1"
                                            title="Excluir serviço"
                                            type="button"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <p className="meta-bold text-app-text-muted uppercase tracking-wider mt-1">{service.category}</p>
                                <p className="body-bold text-brand-primary mt-2">
                                    R$ {service.base_price}
                                    <span className="meta text-app-text-muted ml-1">
                                        {service.pricing_mode === 'hourly' ? '/ hora' : '/ unidade'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
};

export default MyServices;
