import React from 'react';
import { CheckCircle2, XCircle, Clock, Zap, AlertTriangle, Shield } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    completed: { label: 'Concluído', className: 'bg-success/10 text-success', icon: <CheckCircle2 size={10} /> },
    cancelled: { label: 'Cancelado', className: 'bg-error/10 text-error', icon: <XCircle size={10} /> },
    in_execution: { label: 'Em Execução', className: 'bg-folio-accent/10 text-folio-accent', icon: <Zap size={10} /> },
    disputed: { label: 'Disputado', className: 'bg-warning/10 text-warning', icon: <AlertTriangle size={10} /> },
    sent: { label: 'Aguardando', className: 'bg-info/10 text-info', icon: <Clock size={10} /> },
    paid_escrow_held: { label: 'Garantia Retida', className: 'bg-info/10 text-info', icon: <Shield size={10} /> },
    awaiting_payment: { label: 'Ag. Pagamento', className: 'bg-accent/10 text-accent', icon: <Clock size={10} /> },
    open: { label: 'Aberta', className: 'bg-error/10 text-error', icon: <AlertTriangle size={10} /> },
    in_review: { label: 'Em Análise', className: 'bg-warning/10 text-warning', icon: <Clock size={10} /> },
    resolved: { label: 'Resolvida', className: 'bg-success/10 text-success', icon: <CheckCircle2 size={10} /> },
    closed: { label: 'Fechada', className: 'bg-muted text-muted-foreground', icon: <XCircle size={10} /> },
    approved: { label: 'Aprovado', className: 'bg-success/10 text-success', icon: <CheckCircle2 size={10} /> },
    rejected: { label: 'Rejeitado', className: 'bg-error/10 text-error', icon: <XCircle size={10} /> },
    submitted: { label: 'Enviado', className: 'bg-warning/10 text-warning', icon: <Clock size={10} /> },
    pending: { label: 'Pendente', className: 'bg-muted text-muted-foreground', icon: <Clock size={10} /> },
    held: { label: 'Retido', className: 'bg-info/10 text-info', icon: <Shield size={10} /> },
    released: { label: 'Liberado', className: 'bg-success/10 text-success', icon: <CheckCircle2 size={10} /> },
    client: { label: 'Cliente', className: 'bg-muted text-muted-foreground', icon: null },
    provider: { label: 'Profissional', className: 'bg-folio-accent/10 text-folio-accent', icon: null },
    operator: { label: 'Operador', className: 'bg-info/10 text-info', icon: null },
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
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold tracking-wide ${config.className} text-xs ${size === 'md' ? 'px-3 py-1' : ''}`}>
            {config.icon}
            {config.label}
        </span>
    );
};

export default StatusBadge;
