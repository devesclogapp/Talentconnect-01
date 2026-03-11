import React from 'react';
import { Target, AlertCircle, CheckCircle, Scale, BrainCircuit } from 'lucide-react';

interface DecisionIntelligenceProps {
    negotiationData: any;
}

const DecisionIntelligence: React.FC<DecisionIntelligenceProps> = ({ negotiationData }) => {
    // Basic heuristic engine for probability
    const calculateProbabilities = () => {
        let clientProb = 50;
        let providerProb = 50;

        const { order, dispute } = negotiationData;
        const execution = Array.isArray(order?.executions) ? order.executions[0] : order?.executions;

        // Evidence points
        if (execution?.started_at) {
            providerProb += 15;
            clientProb -= 15;
        }
        if (execution?.client_confirmed_start) {
            providerProb += 20;
            clientProb -= 20;
        }
        if (execution?.provider_marked_start && !execution?.started_at) {
            // Started by provider but not officially confirmed
            providerProb += 5;
            clientProb -= 5;
        }
        if (execution?.location_lat) {
            providerProb += 10;
            clientProb -= 10;
        }

        // Delay analysis
        const scheduledAt = order?.scheduled_at ? new Date(order.scheduled_at) : null;
        const startedAt = execution?.started_at ? new Date(execution.started_at) : null;
        if (scheduledAt && !startedAt && (new Date().getTime() > scheduledAt.getTime() + (60 * 60 * 1000))) {
            // More than 1h late and not started
            clientProb += 30;
            providerProb -= 30;
        }

        return {
            client: Math.max(0, Math.min(100, clientProb)),
            provider: Math.max(0, Math.min(100, providerProb))
        };
    };

    const probs = calculateProbabilities();

    const getSummary = () => {
        const { order, dispute } = negotiationData;
        const execution = Array.isArray(order?.executions) ? order.executions[0] : order?.executions;

        if (!execution?.started_at && probs.client > 70) {
            return "Indícios fortes de não comparecimento do profissional. O agendamento foi ultrapassado sem registros de atividade.";
        }
        if (execution?.client_confirmed_start && execution?.started_at) {
            return "Serviço validado pelo cliente no local. Baixa probabilidade de fraude pelo profissional.";
        }
        return "Disputa complexa. Recomenda-se analisar logs de localização e histórico de disputas anteriores de ambas as partes.";
    };

    return (
        <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <BrainCircuit size={14} /> Recomendação da IA de Decisão
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span>Razão Cliente: {probs.client}%</span>
                            <span>Razão Profissional: {probs.provider}%</span>
                        </div>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${probs.client}%` }} />
                            <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${probs.provider}%` }} />
                        </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1.5">
                            <Scale size={12} /> Resumo Analítico
                        </p>
                        <p className="text-xs text-foreground leading-relaxed italic">
                            "{getSummary()}"
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${probs.client > probs.provider ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground opacity-30'}`}>
                            {probs.client > probs.provider ? <CheckCircle size={16} /> : <Target size={16} />}
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Tendência</p>
                            <p className="text-[10px] font-bold">Favorável Cliente</p>
                        </div>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${probs.provider > probs.client ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground opacity-30'}`}>
                            {probs.provider > probs.client ? <CheckCircle size={16} /> : <Target size={16} />}
                        </div>
                        <div>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">Tendência</p>
                            <p className="text-[10px] font-bold">Favorável Prof.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DecisionIntelligence;
