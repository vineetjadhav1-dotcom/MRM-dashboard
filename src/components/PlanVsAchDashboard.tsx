import { useState, useMemo } from 'react';
import { Project } from '@/src/types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  DollarSign, 
  BarChart3, 
  ArrowUpRight, 
  Percent, 
  AlertTriangle, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface PlanVsAchDashboardProps {
  projects: Project[];
  onProjectSelect: (proj: Project) => void;
}

// Helper to parse numeric values from excel strings safely
const parseNumericValue = (val: string | number | undefined): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/[$,%\s]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

// Formatter for values (handles currency formats gracefully as ₹ Cr.)
const formatValue = (val: number, isCurrency: boolean) => {
  if (isCurrency) {
    // VOWD is represented in ₹ Cr. (crore)
    const formatted = val % 1 === 0 ? val.toLocaleString() : val.toFixed(2);
    return `₹ ${formatted} Cr.`;
  }
  return Math.round(val).toLocaleString();
};

export default function PlanVsAchDashboard({ projects, onProjectSelect }: PlanVsAchDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<'milestones' | 'vowd' | 'labour'>('milestones');

  // Compute portfolio-wide aggregated statistics
  const portfolioAggregates = useMemo(() => {
    let milestonePlanTotal = 0;
    let milestoneAchTotal = 0;
    let milestoneFrTotal = 0;

    let vowdPlanTotal = 0;
    let vowdAchTotal = 0;
    let vowdFrTotal = 0;

    let labourPlanTotal = 0;
    let labourAchTotal = 0;
    let labourFrTotal = 0;

    projects.forEach((proj) => {
      if (proj.milestonePlan) milestonePlanTotal += parseNumericValue(proj.milestonePlan);
      if (proj.milestoneAch) milestoneAchTotal += parseNumericValue(proj.milestoneAch);
      if (proj.milestoneFr) milestoneFrTotal += parseNumericValue(proj.milestoneFr);

      if (proj.vowdPlan) vowdPlanTotal += parseNumericValue(proj.vowdPlan);
      if (proj.vowdAch) vowdAchTotal += parseNumericValue(proj.vowdAch);
      if (proj.vowdFr) vowdFrTotal += parseNumericValue(proj.vowdFr);

      if (proj.labourPlan) labourPlanTotal += parseNumericValue(proj.labourPlan);
      if (proj.labourAch) labourAchTotal += parseNumericValue(proj.labourAch);
      if (proj.labourFr) labourFrTotal += parseNumericValue(proj.labourFr);
    });

    const milestonePct = milestonePlanTotal > 0 ? Math.round((milestoneAchTotal / milestonePlanTotal) * 100) : 0;
    const vowdPct = vowdPlanTotal > 0 ? Math.round((vowdAchTotal / vowdPlanTotal) * 100) : 0;
    const labourPct = labourPlanTotal > 0 ? Math.round((labourAchTotal / labourPlanTotal) * 100) : 0;

    return {
      milestones: {
        plan: milestonePlanTotal,
        achievement: milestoneAchTotal,
        pct: milestonePct,
        forecast: milestoneFrTotal,
      },
      vowd: {
        plan: vowdPlanTotal,
        achievement: vowdAchTotal,
        pct: vowdPct,
        forecast: vowdFrTotal,
      },
      labour: {
        plan: labourPlanTotal,
        achievement: labourAchTotal,
        pct: labourPct,
        forecast: labourFrTotal,
      }
    };
  }, [projects]);

  // Map and filter comparison data for Recharts Chart
  const chartData = useMemo(() => {
    return projects
      .filter(p => {
        if (activeCategory === 'milestones') {
          return p.milestonePlan || p.milestoneAch || p.milestoneFr;
        } else if (activeCategory === 'vowd') {
          return p.vowdPlan || p.vowdAch || p.vowdFr;
        } else {
          return p.labourPlan || p.labourAch || p.labourFr;
        }
      })
      .map(p => {
        const plan = parseNumericValue(
          activeCategory === 'milestones' ? p.milestonePlan :
          activeCategory === 'vowd' ? p.vowdPlan : p.labourPlan
        );
        const achievement = parseNumericValue(
          activeCategory === 'milestones' ? p.milestoneAch :
          activeCategory === 'vowd' ? p.vowdAch : p.labourAch
        );
        const forecast = parseNumericValue(
          activeCategory === 'milestones' ? p.milestoneFr :
          activeCategory === 'vowd' ? p.vowdFr : p.labourFr
        );

        return {
          code: p.code,
          name: p.name.length > 22 ? `${p.name.substring(0, 20)}...` : p.name,
          fullName: p.name,
          Plan: plan,
          Achievement: achievement,
          Forecast: forecast,
          rawProject: p
        };
      })
      // Sort by descending Plan volume to make chart cleaner
      .sort((a, b) => b.Plan - a.Plan);
  }, [projects, activeCategory]);

  // Sorted list of project records for breakdown listing
  const rankedProjects = useMemo(() => {
    return chartData.map(item => {
      const pct = item.Plan > 0 ? Math.round((item.Achievement / item.Plan) * 100) : 0;
      return {
        ...item,
        pct
      };
    }).sort((a, b) => b.pct - a.pct); // Sort by highest achievement percentage
  }, [chartData]);

  const isCurrencyCategory = activeCategory === 'vowd';

  return (
    <div className="space-y-8" id="plan-vs-ach-dashboard-root">
      
      {/* Header Description Panel */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-3xl p-6 relative overflow-hidden" id="pva-welcome-banner">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 text-blue-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Executive Performance Module
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Operational Targets vs Accomplishments</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Review portfolio performance metrics comparing cumulative work plans, actual achievements, and forward-looking monthly forecasts. Select a metric category below to deep dive into real-time metrics, project-by-project bars, and interactive ranking boards.
          </p>
        </div>
        <div className="absolute top-0 right-0 h-full w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <TrendingUp className="w-40 h-40 text-blue-600" />
        </div>
      </div>

      {/* Aggregate KPI Grid - Snapshots of all three key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="pva-aggregates-row">
        
        {/* Milestones Agg Card */}
        <div 
          onClick={() => setActiveCategory('milestones')}
          className={`border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
            activeCategory === 'milestones' 
              ? 'bg-blue-600/5 border-blue-200 ring-2 ring-blue-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
          id="pva-card-milestones"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-100/60 text-blue-700 rounded-2xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              portfolioAggregates.milestones.pct >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              portfolioAggregates.milestones.pct >= 75 ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
              {portfolioAggregates.milestones.pct}% Achieved
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Milestones Execution</span>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{portfolioAggregates.milestones.achievement}</span>
            <span className="text-xs font-semibold text-slate-400">/ {portfolioAggregates.milestones.plan} Planned</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div 
              style={{ width: `${Math.min(portfolioAggregates.milestones.pct, 100)}%` }} 
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex justify-between items-center mt-3.5 text-[10px] text-slate-500 font-semibold border-t border-slate-100/80 pt-3">
            <span>Forecast (Next Mo): <span className="text-slate-800 font-bold">{portfolioAggregates.milestones.forecast}</span></span>
            <span className="text-blue-600 hover:underline flex items-center gap-0.5">
              Explore deep-dive <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* VOWD Agg Card */}
        <div 
          onClick={() => setActiveCategory('vowd')}
          className={`border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
            activeCategory === 'vowd' 
              ? 'bg-violet-600/5 border-violet-200 ring-2 ring-violet-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
          id="pva-card-vowd"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-violet-100/60 text-violet-700 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              portfolioAggregates.vowd.pct >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              portfolioAggregates.vowd.pct >= 75 ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
              {portfolioAggregates.vowd.pct}% Achieved
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Value of Work Done</span>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-extrabold text-slate-900">
              {formatValue(portfolioAggregates.vowd.achievement, true)}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              / {formatValue(portfolioAggregates.vowd.plan, true)} Planned
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div 
              style={{ width: `${Math.min(portfolioAggregates.vowd.pct, 100)}%` }} 
              className="h-full bg-violet-600 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex justify-between items-center mt-3.5 text-[10px] text-slate-500 font-semibold border-t border-slate-100/80 pt-3">
            <span>Forecast (Next Mo): <span className="text-slate-800 font-bold">{formatValue(portfolioAggregates.vowd.forecast, true)}</span></span>
            <span className="text-violet-600 hover:underline flex items-center gap-0.5">
              Explore deep-dive <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Labour Force Agg Card */}
        <div 
          onClick={() => setActiveCategory('labour')}
          className={`border rounded-3xl p-5 shadow-xs transition-all cursor-pointer ${
            activeCategory === 'labour' 
              ? 'bg-indigo-600/5 border-indigo-200 ring-2 ring-indigo-500/10' 
              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
          }`}
          id="pva-card-labour"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-100/60 text-indigo-700 rounded-2xl">
              <Activity className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              portfolioAggregates.labour.pct >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              portfolioAggregates.labour.pct >= 75 ? 'bg-amber-50 text-amber-700 border-amber-100' :
              'bg-slate-50 text-slate-600 border-slate-100'
            }`}>
              {portfolioAggregates.labour.pct}% Achieved
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Labour Force Allocation</span>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-2xl font-extrabold text-slate-900">{portfolioAggregates.labour.achievement}</span>
            <span className="text-xs font-semibold text-slate-400">/ {portfolioAggregates.labour.plan} Planned</span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
            <div 
              style={{ width: `${Math.min(portfolioAggregates.labour.pct, 100)}%` }} 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
            />
          </div>

          <div className="flex justify-between items-center mt-3.5 text-[10px] text-slate-500 font-semibold border-t border-slate-100/80 pt-3">
            <span>Forecast (Next Mo): <span className="text-slate-800 font-bold">{portfolioAggregates.labour.forecast}</span></span>
            <span className="text-indigo-600 hover:underline flex items-center gap-0.5">
              Explore deep-dive <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

      </div>

      {/* Primary Deep-Dive Control Tabs and Visualization Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm" id="pva-deep-dive-board">
        
        {/* Dynamic Inner Toggles and Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 mb-6 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Project Comparison Deep-Dive</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Grouped metrics showing baseline target plan vs actual progress</p>
          </div>

          {/* Inner Segmented Tabs */}
          <div className="bg-slate-100/80 rounded-2xl p-1.5 flex space-x-1.5 self-start sm:self-center" id="pva-metric-switcher">
            <button
              onClick={() => setActiveCategory('milestones')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'milestones'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Milestones
            </button>
            <button
              onClick={() => setActiveCategory('vowd')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'vowd'
                  ? 'bg-white text-violet-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              VOWD
            </button>
            <button
              onClick={() => setActiveCategory('labour')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'labour'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Labour
            </button>
          </div>
        </div>

        {/* Visual Charts and Ranked List Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Chart Column (7/12 width) */}
          <div className="lg:col-span-7 flex flex-col justify-between" id="pva-chart-column">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Visual Graph</span>
              <h4 className="text-xs font-bold text-slate-700 mt-0.5">
                {activeCategory === 'milestones' ? 'Monthly Milestone Plan vs Realization' :
                 activeCategory === 'vowd' ? 'Value of Work Done (VOWD) Target vs Actuals' :
                 'Labour Force Commitment vs Physical Presence'}
              </h4>
            </div>

            <div className="h-[360px] w-full bg-slate-50/50 rounded-2xl border border-slate-100 p-4 relative flex items-center justify-center">
              {chartData.length === 0 ? (
                <div className="text-center py-10 space-y-1.5">
                  <AlertTriangle className="w-8 h-8 text-slate-350 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">No valid {activeCategory} metrics registered in dataset.</p>
                  <p className="text-[10px] text-slate-400">Check mapping configuration to sync numeric columns.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 15, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="code" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatValue(val, isCurrencyCategory)}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-slate-150 p-3.5 rounded-2xl shadow-md text-left text-xs max-w-[280px]">
                              <p className="font-bold text-slate-900 truncate mb-1">{data.fullName}</p>
                              <p className="text-[10px] font-mono text-blue-600 font-bold mb-2">[{data.code}]</p>
                              <div className="space-y-1 text-[11px] font-medium text-slate-600">
                                <div className="flex justify-between space-x-6">
                                  <span>Target Plan:</span>
                                  <span className="font-bold text-slate-800">{formatValue(data.Plan, isCurrencyCategory)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Achieved:</span>
                                  <span className="font-bold text-emerald-600">{formatValue(data.Achievement, isCurrencyCategory)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Next Mo Forecast:</span>
                                  <span className="font-bold text-indigo-500">{formatValue(data.Forecast, isCurrencyCategory)}</span>
                                </div>
                                {data.Plan > 0 && (
                                  <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5 text-[10px] font-bold text-slate-500 uppercase">
                                    <span>Achievement Rate:</span>
                                    <span className="text-blue-600">{Math.round((data.Achievement / data.Plan) * 100)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="circle"
                      iconSize={7}
                      formatter={(value) => <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{value}</span>}
                    />
                    <Bar dataKey="Plan" fill={activeCategory === 'milestones' ? '#3b82f6' : activeCategory === 'vowd' ? '#8b5cf6' : '#6366f1'} radius={[4, 4, 0, 0]} barSize={12} name="Planned Target" />
                    <Bar dataKey="Achievement" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} name="Achieved Work" />
                    <Bar dataKey="Forecast" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={12} name="Forecast (Next Mo)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Leaderboard/Ranking Column (5/12 width) */}
          <div className="lg:col-span-5 flex flex-col" id="pva-rankings-column">
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Performance Standings</span>
              <h4 className="text-xs font-bold text-slate-700 mt-0.5">Projects Ranked by Achievement Rate</h4>
            </div>

            <div className="flex-1 max-h-[360px] overflow-y-auto border border-slate-150 rounded-2xl p-2.5 divide-y divide-slate-100 pr-1" id="pva-ranked-scroller">
              {rankedProjects.map((proj, idx) => {
                const badgeColor = 
                  proj.pct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                  proj.pct >= 80 ? 'bg-blue-50 text-blue-700 border-blue-100' :
                  proj.pct >= 50 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                  'bg-rose-50 text-rose-700 border-rose-100';

                return (
                  <div 
                    key={proj.code}
                    onClick={() => onProjectSelect(proj.rawProject)}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50/75 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="space-y-1 truncate pr-3">
                      <div className="flex items-center space-x-1.5 truncate">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded">
                          #{idx + 1}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50/50 px-1 py-0.2 rounded">
                          {proj.code}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate" title={proj.fullName}>
                          {proj.fullName}
                        </span>
                      </div>
                      
                      {/* Sub values summary lines */}
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
                        <span>Plan: <span className="font-semibold text-slate-600">{formatValue(proj.Plan, isCurrencyCategory)}</span></span>
                        <span>•</span>
                        <span>Ach: <span className="font-semibold text-emerald-600">{formatValue(proj.Achievement, isCurrencyCategory)}</span></span>
                        <span>•</span>
                        <span>Fc: <span className="font-semibold text-slate-600">{formatValue(proj.Forecast, isCurrencyCategory)}</span></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border ${badgeColor}`}>
                        {proj.pct}%
                      </span>
                      {/* Tiny visual bar indicator */}
                      <div className="w-12 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden ml-auto">
                        <div 
                          style={{ width: `${Math.min(proj.pct, 100)}%` }} 
                          className={`h-full rounded-full ${
                            proj.pct >= 100 ? 'bg-emerald-500' :
                            proj.pct >= 80 ? 'bg-blue-500' :
                            proj.pct >= 50 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              {rankedProjects.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 italic">
                  No execution records to rank at this time.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Strategic Insights & Context Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="pva-insights-section">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5" id="pva-insight-left">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-600" />
            Performance Variance & Compliance
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Variance indicates the gap between the planned scope of deliverables and the physical progress verified on site. Keeping performance variance within <span className="font-semibold text-slate-700">±10%</span> is critical to preventing scheduled slippages and baseline 1 modifications. Red metrics are prioritized for project sponsorship deep-dives.
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5" id="pva-insight-right">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
            Rolling Forecast Reliability
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Forecast (Next Month) indicates resource and delivery targets promised in the preceding reporting cycle. A high correlation between preceding Forecast and current Achievement is indicative of a highly predictable delivery pipeline and mature sub-contractor governance.
          </p>
        </div>
      </div>

    </div>
  );
}
