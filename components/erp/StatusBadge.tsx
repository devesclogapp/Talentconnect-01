import React from 'react';
import { CheckCircle2, XCircle, Clock, Zap, AlertTriangle, Shield } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    completed: { label: 'Concluído', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
    cancelled: { label: 'Cancelado', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: <XCircle size={10} /> },
    in_execution: { label: 'Em Execução', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: <Zap size={10} /> },
    disputed: { label: 'Disputado', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: <AlertTriangle size={10} /> },
    sent: { label: 'Aguardando', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: <Clock size={10} /> },
    paid_escrow_held: { label: 'Garantia Retida', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: <Shield size={10} /> },
    awaiting_payment: { label: 'Ag. Pagamento', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400', icon: <Clock size={10} /> },
    open: { label: 'Aberta', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: <AlertTriangle size={10} /> },
    in_review: { label: 'Em Análise', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: <Clock size={10} /> },
    resolved: { label: 'Resolvida', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
    closed: { label: 'Fechada', className: 'bg-muted text-muted-foreground', icon: <XCircle size={10} /> },
    approved: { label: 'Aprovado', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
    rejected: { label: 'Rejeitado', className: 'bg-red-500/10 text-red-600 dark:text-red-400', icon: <XCircle size={10} /> },
    submitted: { label: 'Enviado', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400', icon: <Clock size={10} /> },
    pending: { label: 'Pendente', className: 'bg-muted text-muted-foreground', icon: <Clock size={10} /> },
    held: { label: 'Retido', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: <Shield size={10} /> },
    released: { label: 'Liberado', className: 'bg-green-500/10 text-green-600 dark:text-green-400', icon: <CheckCircle2 size={10} /> },
    client: { label: 'Cliente', className: 'bg-muted text-muted-foreground', icon: null },
    provider: { label: 'Profissional', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400', icon: null },
    operator: { label: 'Operador', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', icon: null },
};

interface StatusBadgeProps {
    status: string;
    size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
    const config = STATUS_MAP[status?.toLowerCase()] || {
        label: status?.replace(/_/g, ' ') || '—',
        className: 'bg-muted text-muted-foreground',
        icon: null,
    };

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold uppercase tracking-wide ${config.className} ${size === 'md' ? 'text-[11px] px-3 py-1' : 'text-[9px]'}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

export default StatusBadge;
