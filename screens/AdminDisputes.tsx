import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle2, Clock, Eye, MessageSquare, Scale,
    ShieldAlert, User, ArrowUpCircle, History, MapPin, Zap, RefreshCw,
    X, ArrowRight, TrendingUp, ShieldCheck, Info
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { resolveUserName } from '../utils/userUtils';
import {
    AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
    AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '../components/ui/alert-dialog';
import { Sheet, SheetContent } from '../components/ui/sheet';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import NegotiationDossier from '../components/erp/NegotiationDossier';
import DecisionIntelligence from '../components/erp/DecisionIntelligence';
import SmartTag from '../components/erp/SmartTag';
import TrustScore from '../components/erp/TrustScore';
import KpiCard from '../components/erp/KpiCard';
import { toast } from 'sonner';

interface Dispute {
    id: string;
    order_id: string;
    opened_by: 'client' | 'provider';
    reason: string;
    status: 'open' | 'in_review' | 'resolved' | 'closed';
    created_at: string;
    order: {
        id: string;
        client_id: string;
        provider_id: string;
        service_id: string;
        total_amount: number;
        status: string;
        client: { id: string; name: string; email: string; avatar_url?: string; trustScore?: number; };
        provider: { id: string; name: string; email: string; avatar_url?: string; trustScore?: number; };
        service: { id: string; title: string; category?: string; };
        scheduled_at: string;
    } | null;
}

const AdminDisputes: React.FC = () => {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<'analyze' | 'resolve_release' | 'resolve_refund' | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [selectedProofs, setSelectedProofs] = useState<string[]>([]);

    useEffect(() => { fetchDisputes(); }, []);

    const fetchDisputes = async () => {
        setIsLoading(true);
        try {
            const { data: disputesData, error: disputesError } = await supabase
                .from('disputes').select('*').order('created_at', { ascending: false });
            if (disputesError) throw disputesError;

            const orderIds = [...new Set((disputesData || []).map(d => d.order_id))];
            const { data: ordersData } = await supabase
                .from('orders').select('id, client_id, provider_id, service_id, status, total_amount, scheduled_at')
                .in('id', orderIds);

            const clientIds = [...new Set((ordersData || []).map(o => o.client_id))];
            const providerIds = [...new Set((ordersData || []).map(o => o.provider_id))];
            const allUserIds = [...new Set([...clientIds, ...providerIds])];

            const { data: usersData } = await supabase.from('users').select('id, name, email, avatar_url').in('id', allUserIds);
            const serviceIds = [...new Set((ordersData || []).map(o => o.service_id))];
            const { data: servicesData } = await supabase.from('services').select('id, title, category').in('id', serviceIds);

            const formattedData = (disputesData || []).map(dispute => {
                const orderRaw = (ordersData || []).find(o => o.id === dispute.order_id);
                if (!orderRaw) return { ...dispute, order: null };
                const clientObj = (usersData || []).find(u => u.id === orderRaw.client_id);
                const providerObj = (usersData || []).find(u => u.id === orderRaw.provider_id);
                const serviceObj = (servicesData || []).find(s => s.id === orderRaw.service_id);
                return {
                    ...dispute,
                    order: { ...orderRaw, client: clientObj || { id: orderRaw.client_id }, provider: providerObj || { id: orderRaw.provider_id }, service: serviceObj || { id: orderRaw.service_id } }
                };
            });
            setDisputes(formattedData as Dispute[]);
        } catch (error) { console.error(error); }
        finally { setIsLoading(false); }
    };

    const fetchAuditLogs = async (orderId: string) => {
        const { data } = await supabase.from('audit_logs').select('*').eq('entity_id', orderId).order('created_at', { ascending: false });
        setAuditLogs(data || []);
    };

    const handleSelectDispute = async (dispute: Dispute) => {
        setSelectedDispute(dispute);
        fetchAuditLogs(dispute.order_id);
        const clientId = dispute.order?.client_id;
        const providerId = dispute.order?.provider_id;
        if (!clientId || !providerId) return;

        try {
            const [clientStats, providerStats] = await Promise.all([fetchUserStats(clientId), fetchUserStats(providerId)]);
            const clientTrust = calculateTrust(clientStats.totalOrders, clientStats.disputes);
            const providerTrust = calculateTrust(providerStats.totalOrders, providerStats.disputes);
            setSelectedDispute(prev => {
                if (!prev || !prev.order) return prev;
                return {
                    ...prev,
                    order: {
                        ...prev.order,
                        client: { ...(prev.order.client || {}), ...(clientStats.profile || {}), trustScore: clientTrust } as any,
                        provider: { ...(prev.order.provider || {}), ...(providerStats.profile || {}), trustScore: providerTrust } as any
                    }
                };
            });
        } catch (err) { console.warn(err); }
    };

    const calculateTrust = (orders: number, disputes: number) => orders === 0 ? 80 : Math.floor(((orders - disputes) / orders) * 100);

    const fetchUserStats = async (userId: string) => {
        const [ordersRes, disputesRes, profileRes] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).or(`client_id.eq.${userId},provider_id.eq.${userId}`),
            supabase.from('disputes').select('*, order:orders!inner(*)', { count: 'exact', head: true }).or(`order.client_id.eq.${userId},order.provider_id.eq.${userId}`),
            supabase.from('users').select('id, name, email, avatar_url').eq('id', userId).single()
        ]);
        return { totalOrders: ordersRes.count || 0, disputes: disputesRes.count || 0, profile: profileRes.data };
    };

    const performAction = async () => {
        if (!selectedDispute || !pendingAction || !selectedDispute.order) return;
        setIsProcessing(selectedDispute.id);
        try {
            let newStatus = selectedDispute.status;
            let orderStatus = selectedDispute.order.status;
            let paymentStatus = 'held';

            if (pendingAction === 'analyze') { newStatus = 'in_review'; }
            else if (pendingAction === 'resolve_release') { newStatus = 'resolved'; orderStatus = 'completed'; paymentStatus = 'released'; }
            else if (pendingAction === 'resolve_refund') { newStatus = 'resolved'; orderStatus = 'cancelled'; paymentStatus = 'refunded'; }

            await (supabase.from('disputes') as any).update({ status: newStatus }).eq('id', selectedDispute.id);
            if (pendingAction !== 'analyze') {
                await (supabase.from('orders') as any).update({ status: orderStatus }).eq('id', selectedDispute.order_id);
                await (supabase.from('payments') as any).update({ escrow_status: paymentStatus }).eq('order_id', selectedDispute.order_id);
                await (supabase.from('audit_logs') as any).insert({
                    entity_type: 'order', entity_id: selectedDispute.order_id, action: 'admin_resolution',
                    payload_json: { decision: pendingAction, reason: actionReason, evidence: selectedProofs, resolved_by: 'admin_portal' }
                });
            }
            toast.success('Decisão processada com sucesso!');
            fetchDisputes(); setSelectedDispute(null); setPendingAction(null); setActionReason(''); setSelectedProofs([]);
        } catch (error: any) { toast.error(`Falha: ${error.message}`); }
        finally { setIsProcessing(null); }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors = {
            open: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            in_review: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            resolved: 'bg-[#1DB97A]/10 text-[#1DB97A] border-[#1DB97A]/20',
            closed: 'bg-folio-text-dim/10 text-folio-text-dim border-folio-border'
        };
        const labels = { open: 'Aberto', in_review: 'Em análise', resolved: 'Resolvido', closed: 'Fechado' };
        return (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border tracking-widest ${colors[status as keyof typeof colors]}`}>
                {labels[status as keyof typeof labels]}
            </span>
        );
    };

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
    const formatCurrency = (v: number) => `R$ ${(v || 0).toFixed(2)}`;

    return (
        <div className="space-y-8 pb-16 animate-fade-in">

            <AlertDialog open={!!pendingAction} onOpenChange={(open) => { if (!open) { setPendingAction(null); setActionReason(''); setSelectedProofs([]); } }}>
                <AlertDialogContent className="sm:!max-w-[720px] w-[95vw] !rounded-[32px] p-0 bg-folio-bg border-folio-border shadow-2xl overflow-hidden flex flex-col !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 max-h-[90vh]">
                    <div className="p-8 pb-4 shrink-0">
                        <AlertDialogHeader className="mb-0">
                            <AlertDialogTitle className="text-xl font-black text-folio-text tracking-tight">
                                {pendingAction === 'analyze' ? 'Elevar para análise crítica' : pendingAction === 'resolve_release' ? 'Liberar pagamento' : 'Estornar valor'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs font-medium text-folio-text-dim/60">
                                {pendingAction === 'analyze' ? 'O protocolo de mediação será ativado.' : 'Esta decisão é irreversível e será auditada.'}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    {pendingAction !== 'analyze' && (
                        <ScrollArea className="flex-1 min-h-0 px-8">
                            <div className="space-y-8 pb-6">
                                <DecisionIntelligence negotiationData={{ order: selectedDispute?.order, dispute: selectedDispute }} />

                                <div className="space-y-4">
                                    <label className="text-xs font-black text-folio-text-dim/40 tracking-[3px] ml-1">Evidências Consideradas</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'LATENCIA', label: 'Latência de Início', icon: <Clock size={16} /> },
                                            { id: 'LOCALIZACAO', label: 'Localização GPS', icon: <MapPin size={16} /> },
                                            { id: 'LOGS_SISTEMA', label: 'Análise de Logs', icon: <History size={16} /> },
                                            { id: 'CONTESTACAO', label: 'Contestação Direta', icon: <ShieldAlert size={16} /> }
                                        ].map(proof => (
                                            <button key={proof.id} onClick={() => setSelectedProofs(prev => prev.includes(proof.label) ? prev.filter(p => p !== proof.label) : [...prev, proof.label])}
                                                className={`flex items-center gap-3 px-5 py-4 rounded-[20px] border-2 transition-all ${selectedProofs.includes(proof.label) ? 'bg-folio-accent/10 border-folio-accent/50 text-folio-accent' : 'bg-folio-surface border-folio-border text-folio-text-dim hover:border-folio-text-dim/30'}`}>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedProofs.includes(proof.label) ? 'border-folio-accent' : 'border-folio-border'}`}>
                                                    {selectedProofs.includes(proof.label) && <div className="w-2 h-2 rounded-full bg-folio-accent shadow-glow" />}
                                                </div>
                                                <span className="font-black text-xs tracking-widest">{proof.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-2 bg-folio-surface border border-folio-border rounded-[28px] shadow-folio">
                                    <div className="flex flex-wrap items-center gap-2 p-3 bg-folio-bg rounded-[20px] border border-folio-border/50 mb-2">
                                        <SmartTag type="CLIENTE" label={resolveUserName(selectedDispute?.order?.client)} data={selectedDispute?.order?.client} />
                                        <SmartTag type="PROFISSIONAL" label={resolveUserName(selectedDispute?.order?.provider)} data={selectedDispute?.order?.provider} />
                                        <SmartTag type="VALOR" label={formatCurrency(selectedDispute?.order?.total_amount || 0)} data={selectedDispute?.order} />
                                    </div>
                                    <textarea value={actionReason} onChange={e => setActionReason(e.target.value)}
                                        className="w-full h-20 rounded-[20px] p-6 text-sm font-medium outline-none bg-transparent text-folio-text placeholder:text-folio-text-dim/30 leading-relaxed resize-none"
                                        placeholder="Descreva a fundamentação técnica da decisão..."
                                    />
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    <div className="p-6 pt-4 border-t border-folio-border bg-folio-surface shrink-0 flex justify-end gap-3 rounded-b-[32px]">
                        <button
                            onClick={() => { setPendingAction(null); setActionReason(''); }}
                            className="h-12 px-6 rounded-xl border border-folio-border text-xs font-black tracking-widest text-folio-text-dim hover:bg-folio-bg transition-all"
                        >
                            Descartar
                        </button>
                        <button
                            disabled={!actionReason || isProcessing === selectedDispute?.id}
                            onClick={performAction}
                            className={`h-12 px-8 rounded-xl border-none text-xs font-black tracking-widest text-white shadow-glow transition-all active:scale-95 ${pendingAction === 'resolve_refund' ? 'bg-[#E24B4A]' : 'bg-folio-accent'} disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
                        >
                            {isProcessing ? 'Processando...' : 'Executar sentença'}
                        </button>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Sheet — Mediação ── */}
            <Sheet open={!!selectedDispute} onOpenChange={o => !o && setSelectedDispute(null)}>
                <SheetContent side="right" className="w-full sm:!max-w-[600px] p-0 flex flex-col bg-folio-bg border-l border-folio-border shadow-2xl overflow-hidden">
                    {selectedDispute && (
                        <div className="flex flex-col h-full bg-folio-bg">
                            <div className="flex-1 overflow-y-auto">
                                <NegotiationDossier data={selectedDispute} auditLogs={auditLogs} onBack={() => setSelectedDispute(null)} />
                            </div>
                            <div className="p-6 border-t border-folio-border bg-folio-surface flex flex-wrap gap-2">
                                <button onClick={() => setPendingAction('resolve_release')} className="flex-1 min-w-[120px] h-12 bg-[#1DB97A]/10 text-[#1DB97A] border border-[#1DB97A]/20 rounded-xl text-xs font-black tracking-widest hover:bg-[#1DB97A] hover:text-white transition-all">Liberar escrow</button>
                                <button onClick={() => setPendingAction('resolve_refund')} className="flex-1 min-w-[120px] h-12 bg-[#E24B4A]/10 text-[#E24B4A] border border-[#E24B4A]/20 rounded-xl text-xs font-black tracking-widest hover:bg-[#E24B4A] hover:text-white transition-all">Estornar cliente</button>
                                <button onClick={() => setPendingAction('analyze')} className="w-full h-12 bg-folio-text text-folio-bg rounded-xl text-xs font-black tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"><Zap size={16} className="text-folio-accent" /> Analisar caso</button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-folio-text tracking-tight leading-none">Mediação de Conflitos</h1>
                    <p className="text-xs font-bold text-folio-text-dim/50 tracking-[2px] mt-2">Dossiê e Governança de Escrow Operacional</p>
                </div>
                <button onClick={fetchDisputes} className="w-11 h-11 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-surface text-folio-text-dim hover:text-folio-accent hover:rotate-180 transition-all duration-700 shadow-sm"><RefreshCw size={18} /></button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Disputas em Aberto" value={disputes.filter(d => d.status === 'open').length} icon={<AlertTriangle size={18} />} trend="Crítico" color="text-[#E24B4A]" bg="bg-[#E24B4A]/10" />
                <KpiCard label="Em Análise" value={disputes.filter(d => d.status === 'in_review').length} icon={<Clock size={18} />} trend="Pendente" color="text-[#F5C842]" bg="bg-[#F5C842]/10" />
                <KpiCard label="Resolvidos (30d)" value={disputes.filter(d => d.status === 'resolved').length} icon={<CheckCircle2 size={18} />} trend="Global" color="text-[#1DB97A]" bg="bg-[#1DB97A]/10" />
                <KpiCard label="SLA de Resposta" value="4.2h" icon={<TrendingUp size={18} />} trend="Operacional" />
            </div>

            <div className="bg-folio-surface border border-folio-border rounded-[32px] p-6 shadow-folio">
                <div className="hidden md:grid grid-cols-12 px-8 py-4 opacity-40">
                    <div className="col-span-3 text-xs font-black text-folio-text tracking-[2px]">Caso / Protocolo</div>
                    <div className="col-span-4 text-xs font-black text-folio-text tracking-[2px]">Reclamante / Motivo</div>
                    <div className="col-span-2 text-xs font-black text-folio-text tracking-[2px]">Valor</div>
                    <div className="col-span-2 text-xs font-black text-folio-text tracking-[2px]">Status</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-4 mt-2">
                    {disputes.map(dispute => (
                        <div key={dispute.id} onClick={() => handleSelectDispute(dispute)}
                            className="grid grid-cols-12 items-center px-8 py-6 bg-folio-bg border border-folio-border rounded-[28px] hover:border-folio-accent/40 shadow-sm hover:shadow-glow-dim transition-all group cursor-pointer">
                            <div className="col-span-3">
                                <p className="text-xs font-black text-folio-text-dim/40 font-mono mb-1 tracking-tighter">#{dispute.id.slice(0, 8)}</p>
                                <p className="text-xs font-bold text-folio-text-dim/60 tracking-widest">{formatDate(dispute.created_at)}</p>
                            </div>
                            <div className="col-span-4 pr-10">
                                <p className="text-sm font-black text-folio-text tracking-tight truncate leading-none">{dispute.reason || 'S/ descritivo'}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`px-2 py-0.5 rounded-md text-xs font-black tracking-widest border ${dispute.opened_by === 'client' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/20'}`}>
                                        {dispute.opened_by === 'client' ? 'CLI' : 'PRO'}
                                    </span>
                                    <p className="text-xs font-bold text-folio-text-dim/60 truncate">{resolveUserName(dispute.opened_by === 'client' ? dispute.order?.client : dispute.order?.provider)}</p>
                                </div>
                            </div>
                            <div className="col-span-2 font-mono text-sm font-black text-folio-text tabular-nums tracking-tighter shadow-glow px-3 py-1 bg-folio-surface border border-folio-border rounded-xl w-fit">
                                {formatCurrency(dispute.order?.total_amount)}
                            </div>
                            <div className="col-span-2">
                                <StatusBadge status={dispute.status} />
                            </div>
                            <div className="col-span-1 text-right">
                                <button className="w-10 h-10 flex items-center justify-center rounded-2xl border border-folio-border bg-folio-surface text-folio-text-dim group-hover:bg-folio-accent group-hover:text-white group-hover:border-folio-accent transition-all">
                                    <Eye size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDisputes;
