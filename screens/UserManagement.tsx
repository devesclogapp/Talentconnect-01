import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    UserCheck,
    UserX,
    Shield,
    Mail,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    CheckCircle,
    Slash,
    Download
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateUserStatus = async (userId: string, updates: any) => {
        try {
            setIsUpdating(true);
            const { error } = await (supabase as any)
                .from('users')
                .update(updates)
                .eq('id', userId);

            if (error) throw error;

            // Local update
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, ...updates });
            }
            alert('Usuário atualizado com sucesso!');
        } catch (error: any) {
            alert('Erro ao atualizar: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Nome', 'Email', 'Papel', 'KYC', 'Criado em'];
        const rows = filteredUsers.map(u => [
            u.id,
            u.user_metadata?.name || '',
            u.email || '',
            u.user_metadata?.role || 'client',
            u.user_metadata?.documents_status || 'pending',
            u.created_at
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredUsers = users.filter(user => {
        const name = (user.name || user.user_metadata?.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const matchesSearch = email.includes(searchTerm.toLowerCase()) || name.includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || (user.role || user.user_metadata?.role || 'client').toLowerCase() === filterRole.toLowerCase();
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-bg-primary border border-border-subtle rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-bg-secondary/30">
                            <h2 className="heading-lg">Detalhes do Usuário</h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-bg-tertiary rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Profile Info */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-3xl bg-accent-primary/10 flex items-center justify-center text-3xl font-black text-accent-primary border border-accent-primary/20">
                                        {selectedUser.user_metadata?.avatar_url ? (
                                            <img src={selectedUser.user_metadata.avatar_url} className="w-full h-full object-cover rounded-3xl" />
                                        ) : (
                                            selectedUser.user_metadata?.name?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-text-primary">{selectedUser.user_metadata?.name || 'Sem nome'}</h3>
                                        <p className="text-xs text-text-tertiary">{selectedUser.email}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs py-2 border-b border-border-subtle">
                                        <span className="text-text-tertiary font-bold uppercase tracking-widest">ID ÚNICO</span>
                                        <span className="text-text-primary font-mono">{selectedUser.id.slice(0, 12)}...</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-2 border-b border-border-subtle">
                                        <span className="text-text-tertiary font-bold uppercase tracking-widest">PAPEL</span>
                                        <span className="text-accent-primary font-black uppercase">{(selectedUser.role || selectedUser.user_metadata?.role || 'client')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs py-2 border-b border-border-subtle">
                                        <span className="text-text-tertiary font-bold uppercase tracking-widest">CADASTRO</span>
                                        <span className="text-text-primary">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions area */}
                            <div className="bg-bg-secondary/30 rounded-3xl p-6 space-y-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-text-tertiary mb-4 tracking-widest">Ações Administrativas</p>

                                    <div className="space-y-3">
                                        {/* KYC Actions */}
                                        <p className="text-[9px] font-bold text-text-tertiary italic">Validação de Documentos (KYC):</p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={isUpdating || selectedUser.documents_status === 'approved'}
                                                onClick={() => updateUserStatus(selectedUser.id, { documents_status: 'approved' })}
                                                className="flex-1 bg-success/10 text-success border border-success/20 py-2 rounded-xl text-[10px] font-bold hover:bg-success/20 transition-all disabled:opacity-30"
                                            >
                                                Aprovar
                                            </button>
                                            <button
                                                disabled={isUpdating || selectedUser.documents_status === 'rejected'}
                                                onClick={() => updateUserStatus(selectedUser.id, { documents_status: 'rejected' })}
                                                className="flex-1 bg-error/10 text-error border border-error/20 py-2 rounded-xl text-[10px] font-bold hover:bg-error/20 transition-all disabled:opacity-30"
                                            >
                                                Rejeitar
                                            </button>
                                        </div>

                                        {/* Role Actions */}
                                        <p className="text-[9px] font-bold text-text-tertiary italic mt-4">Alterar Privilégios:</p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => updateUserStatus(selectedUser.id, { role: 'operator' })}
                                                className="flex-1 bg-purple-500/10 text-purple-500 border border-purple-500/20 py-2 rounded-xl text-[10px] font-bold hover:bg-purple-500/20 transition-all"
                                            >
                                                Tornar Operator
                                            </button>
                                            <button
                                                disabled={isUpdating}
                                                onClick={() => updateUserStatus(selectedUser.id, { role: 'client' })}
                                                className="flex-1 bg-bg-tertiary text-text-secondary border border-border-subtle py-2 rounded-xl text-[10px] font-bold hover:bg-bg-primary transition-all"
                                            >
                                                Resetar Client
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="heading-xl text-text-primary">Gestão de Usuários</h1>
                    <p className="text-sm text-text-tertiary">Controle e visualize todos os membros da plataforma</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Download size={18} /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* toolbar */}
            <div className="bg-bg-primary border border-border-subtle p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-bg-secondary border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:border-accent-primary transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-bg-secondary border border-border-subtle rounded-xl px-4 py-2 text-sm outline-none focus:border-accent-primary"
                    >
                        <option value="all">Todos os Papéis</option>
                        <option value="client">Clientes</option>
                        <option value="provider">Prestadores</option>
                        <option value="operator">Operadores</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-bg-primary border border-border-subtle rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-secondary/50 border-b border-border-subtle">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Papel</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status KYC</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Último Acesso</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Carregando usuários...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-tertiary text-sm">Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-bg-secondary/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary font-bold text-xs overflow-hidden">
                                                    {user.user_metadata?.avatar_url || user.avatar_url ? (
                                                        <img src={user.user_metadata?.avatar_url || user.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (user.name || user.user_metadata?.name || 'U').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-primary">{user.name || user.user_metadata?.name || 'Sem nome'}</p>
                                                    <p className="text-[10px] text-text-tertiary truncate max-w-[150px]">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${(user.role || user.user_metadata?.role) === 'provider' ? 'bg-blue-500/10 text-blue-500' :
                                                (user.role || user.user_metadata?.role) === 'operator' ? 'bg-purple-500/10 text-purple-500' :
                                                    'bg-bg-tertiary text-text-secondary'
                                                }`}>
                                                {user.role || user.user_metadata?.role || 'client'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.documents_status === 'approved' || user.user_metadata?.documents_status === 'approved' ? 'bg-success' :
                                                    user.documents_status === 'rejected' || user.user_metadata?.documents_status === 'rejected' ? 'bg-error' :
                                                        'bg-warning'
                                                    }`}></div>
                                                <span className="text-[10px] font-bold text-text-secondary capitalize">
                                                    {user.documents_status || user.user_metadata?.documents_status || 'Pendente'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-[10px] text-text-tertiary font-medium">
                                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 hover:bg-bg-secondary rounded-lg text-accent-primary transition-all hover:scale-110"
                                                title="Ver Detalhes"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-bg-secondary/10">
                    <p className="text-[10px] text-text-tertiary">Mostrando {filteredUsers.length} de {users.length} usuários</p>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;

