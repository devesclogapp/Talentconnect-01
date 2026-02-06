import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  Home,
  Calendar,
  User as UserIcon,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  DollarSign,
  TrendingDown,
  Clock
} from 'lucide-react';
import { getProviderOrders } from '../services/ordersService';

interface Props { onBack: () => void; onNavigate: (v: string) => void; }

const Earnings: React.FC<Props> = ({ onBack, onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [totalServices, setTotalServices] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const orders: any[] = await getProviderOrders();

        // Filter completed orders
        const completed = orders?.filter(o => o.status === 'completed') || [];
        setCompletedOrders(completed.slice(0, 5)); // Last 5 for history
        setTotalServices(completed.length);

        // Calculate total balance
        const total = completed.reduce((acc, current) => acc + (current.total_amount || 0), 0);
        setBalance(total);

        // Calculate this month's earnings
        const now = new Date();
        const thisMonth = completed.filter(o => {
          const orderDate = new Date(o.scheduled_at || o.created_at);
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        });
        const monthTotal = thisMonth.reduce((acc, current) => acc + (current.total_amount || 0), 0);
        setMonthlyEarnings(monthTotal);

        // Calculate weekly data (last 7 days)
        const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
        const dayMap: Record<string, number> = {};

        // Initialize last 7 days inclusive today
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dayMap[d.toDateString()] = 0;
        }

        completed.forEach(o => {
          const d = new Date(o.scheduled_at || o.created_at).toDateString();
          if (dayMap[d] !== undefined) {
            dayMap[d] += (o.total_amount || 0);
          }
        });

        const weekly = Object.entries(dayMap).map(([dateStr, value]) => {
          const d = new Date(dateStr);
          return {
            name: days[d.getDay()],
            value,
            fullDate: d
          };
        }).sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());

        setChartData(weekly);
      } catch (error) {
        console.error("Erro ao carregar ganhos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  const averagePerService = totalServices > 0 ? balance / totalServices : 0;

  return (
    <div className="min-h-screen pb-32 transition-colors animate-fade-in bg-app-bg">
      <header className="safe-area-top sticky top-0 z-40 bg-white dark:bg-black border-b border-neutral-100 dark:border-neutral-900 px-4 py-4 flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-sm interactive">
          <ArrowLeft size={18} />
        </button>
        <h2 className="meta-bold uppercase tracking-[0.2em] text-[10px]">Meus Ganhos</h2>
        <div className="w-10"></div>
      </header>

      <div className="py-6 space-y-6">
        {/* Balance Card - Uber Dark Tech */}
        <section className="px-4">
          <div className="relative overflow-hidden rounded-sm p-8 text-white bg-black border border-neutral-800">
            <div className="absolute right-[-20px] top-[-20px] w-32 h-32 bg-primary-orange/20 rotate-45 blur-2xl"></div>

            <div className="relative z-10">
              <p className="meta-bold uppercase tracking-[0.2em] opacity-40 !text-[9px] flex items-center gap-2 mb-3">
                <Banknote size={14} className="text-black-orange" /> Saldo Disponível
              </p>
              <h2 className="text-4xl font-black mb-10 tracking-tighter">
                R$ {balance.toFixed(2)}
              </h2>

              <button className="w-full h-14 bg-primary-orange text-white rounded-none meta-bold uppercase tracking-[0.2em] !text-[11px] active:scale-95 transition-all shadow-xl shadow-primary-orange/20 flex items-center justify-center gap-2">
                <Wallet size={16} />
                Solicitar Transferência
              </button>
            </div>
          </div>
        </section>

        {/* Statistics - Uber Sharp Grid */}
        <section className="px-4">
          <div className="grid grid-cols-3 gap-2">
            <StatBlock icon={<CheckCircle size={16} />} value={totalServices} label="Serviços" color="text-black-orange" />
            <StatBlock icon={<DollarSign size={16} />} value={averagePerService.toFixed(0)} label="Média" color="text-white" />
            <StatBlock icon={<TrendingUp size={16} />} value={monthlyEarnings.toFixed(0)} label="Este Mês" color="text-black-orange" />
          </div>
        </section>

        {/* Weekly Chart - Uber Minimalist */}
        <section className="px-4">
          <div className="bg-white dark:bg-black rounded-sm p-6 border border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="meta-bold text-text-primary uppercase tracking-[0.2em] !text-[9px] mb-1">Performance</h3>
                <p className="meta-bold text-text-tertiary !text-[8px] uppercase tracking-widest">Últimos 7 dias</p>
              </div>
              <div className="w-8 h-8 rounded-none bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-black-orange">
                <TrendingUp size={16} />
              </div>
            </div>

            <div className="h-40 w-full mb-6">
              {loading ? (
                <div className="h-full flex items-center justify-center meta text-text-primary uppercase tracking-widest !text-[10px]">Analisando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: '#666', fontWeight: 700 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 95, 31, 0.05)' }}
                      contentStyle={{
                        backgroundColor: '#000',
                        borderRadius: '0px',
                        border: '1px solid #333',
                        padding: '10px'
                      }}
                      itemStyle={{ color: '#FF5F1F', fontSize: '10px', fontWeight: 'bold' }}
                      labelStyle={{ color: '#999', fontSize: '8px', marginBottom: '4px', textTransform: 'uppercase' }}
                      formatter={(value: any) => [`R$ ${value}`, 'VALOR']}
                    />
                    <Bar dataKey="value" radius={[0, 0, 0, 0]} barSize={20}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.value > 0 ? '#FF5F1F' : 'rgba(102, 102, 102, 0.2)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Recent Transactions - Uber List */}
        {completedOrders.length > 0 && (
          <section className="px-4 pb-10">
            <h3 className="meta-bold text-neutral-300 uppercase tracking-[0.2em] !text-[9px] mb-4">Registro Histórico</h3>
            <div className="space-y-1">
              {completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-950 p-4 border-b border-neutral-50 dark:border-neutral-900 flex items-center justify-between group interactive"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-black-orange border border-neutral-100 dark:border-neutral-800">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <p className="meta-bold uppercase tracking-tight !text-[12px] text-text-primary">
                        {order.service?.title || 'Serviço'}
                      </p>
                      <p className="meta !text-[9px] text-text-secondary flex items-center gap-1 uppercase tracking-widest mt-0.5">
                        <Clock size={10} />
                        {new Date(order.scheduled_at || order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="meta-bold !text-[14px] text-black-orange">
                      +R$ {order.total_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-black border-t border-neutral-100 dark:border-neutral-900 flex items-center justify-around px-6 z-50 safe-area-bottom">
        <NavButton active={false} icon={<Home size={22} />} onClick={() => onNavigate('PROVIDER_DASHBOARD')} />
        <NavButton active={true} icon={<Wallet size={22} />} onClick={() => { }} />
        <NavButton active={false} icon={<Calendar size={22} />} onClick={() => onNavigate('AGENDA')} />
        <NavButton active={false} icon={<UserIcon size={22} />} onClick={() => onNavigate('PROFILE')} />
      </nav>
    </div>
  );
};

const StatBlock = ({ icon, value, label, color }: any) => (
  <div className="bg-neutral-50 dark:bg-neutral-950 rounded-sm p-4 border border-neutral-100 dark:border-neutral-900">
    <div className={`mb-2 ${color} opacity-80`}>{icon}</div>
    <p className="heading-md !text-[18px] tracking-tighter mb-0.5 text-text-primary">{value}</p>
    <p className="meta-bold text-text-secondary uppercase tracking-widest !text-[8px]">{label}</p>
  </div>
);

const NavButton = ({ active, icon, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-12 h-12 transition-all ${active ? 'text-black-orange scale-110' : 'text-neutral-300 dark:text-neutral-600'
      }`}
  >
    {icon}
    {active && <div className="w-1 h-1 bg-primary-orange rounded-full mt-1.5 animate-pulse"></div>}
  </button>
);

export default Earnings;
