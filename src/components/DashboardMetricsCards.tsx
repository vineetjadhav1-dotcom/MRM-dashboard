import { DashboardMetrics } from '@/src/types';
import { 
  FolderGit2, 
  Users, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Building
} from 'lucide-react';

interface DashboardMetricsCardsProps {
  metrics: DashboardMetrics;
}

export default function DashboardMetricsCards({ metrics }: DashboardMetricsCardsProps) {
  const { totalProjects, totalVPs, totalLeaders, totalAreas, statusCounts } = metrics;

  const greenCount = statusCounts['Green'] || 0;
  const amberCount = statusCounts['Amber'] || 0;
  const redCount = statusCounts['Red'] || 0;
  const grayCount = statusCounts['Gray'] || 0;

  const greenPct = totalProjects > 0 ? Math.round((greenCount / totalProjects) * 100) : 0;
  const amberPct = totalProjects > 0 ? Math.round((amberCount / totalProjects) * 100) : 0;
  const redPct = totalProjects > 0 ? Math.round((redCount / totalProjects) * 100) : 0;
  const grayPct = totalProjects > 0 ? Math.round((grayCount / totalProjects) * 100) : 0;

  const cards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: FolderGit2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/70 border-blue-100',
      desc: 'Active projects tracked in MRM'
    },
    {
      title: 'Reporting VPs',
      value: totalVPs,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50/70 border-indigo-100',
      desc: 'Executive sponsors assigned'
    },
    {
      title: 'Project Leaders',
      value: totalLeaders,
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50/70 border-violet-100',
      desc: 'Active operational leads'
    },
    {
      title: 'Strategic Areas',
      value: totalAreas,
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/70 border-purple-100',
      desc: 'Unique vertical focus domains'
    },
    {
      title: 'Area Under Construction',
      value: metrics.totalAreaUnderConstruction ? metrics.totalAreaUnderConstruction.toLocaleString() : '0',
      suffix: ' Sqft',
      icon: Building,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/70 border-emerald-100',
      desc: 'Sum of active construction area'
    }
  ];

  return (
    <div className="space-y-6 font-sans" id="metrics-dashboard-box">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" id="kpi-grid">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className={`p-5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md hover:translate-y-[-1px] flex flex-col justify-between`}
              id={`kpi-card-${idx}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.bgColor.split(' ')[0]} border ${card.bgColor.split(' ')[1]}`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                  {card.suffix && <span className="text-xs text-slate-500 font-medium">{card.suffix}</span>}
                </span>
                <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wide">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* RAG Health Status Rollup Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" id="rag-rollup-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center">
              <Activity className="w-4 h-4 mr-1.5 text-slate-500" />
              Overall Project RAG Health Index
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">Aggregate delivery metrics for this monthly cycle</p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <span className="flex items-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Green: {greenCount} ({greenPct}%)
            </span>
            <span className="flex items-center text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Amber: {amberCount} ({amberPct}%)
            </span>
            <span className="flex items-center text-rose-600">
              <XCircle className="w-3.5 h-3.5 mr-1" /> Red: {redCount} ({redPct}%)
            </span>
            {grayCount > 0 && (
              <span className="flex items-center text-slate-500">
                <HelpCircle className="w-3.5 h-3.5 mr-1" /> Other: {grayCount} ({grayPct}%)
              </span>
            )}
          </div>
        </div>

        {/* Visual Percent Bar */}
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex" id="rag-percent-bar">
          {greenCount > 0 && (
            <div 
              style={{ width: `${greenPct}%` }} 
              className="bg-emerald-500 h-full transition-all" 
              title={`Green: ${greenPct}%`} 
            />
          )}
          {amberCount > 0 && (
            <div 
              style={{ width: `${amberPct}%` }} 
              className="bg-amber-400 h-full transition-all" 
              title={`Amber: ${amberPct}%`} 
            />
          )}
          {redCount > 0 && (
            <div 
              style={{ width: `${redPct}%` }} 
              className="bg-rose-500 h-full transition-all" 
              title={`Red: ${redPct}%`} 
            />
          )}
          {grayCount > 0 && (
            <div 
              style={{ width: `${grayPct}%` }} 
              className="bg-slate-400 h-full transition-all" 
              title={`Other: ${grayPct}%`} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
