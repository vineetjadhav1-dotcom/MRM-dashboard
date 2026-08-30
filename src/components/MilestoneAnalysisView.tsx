import React, { useState, useMemo } from 'react';
import { Software3Milestone, Project, Software2Project } from '@/src/types';
import { 
  Search, 
  Filter, 
  Flag, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Building2, 
  Users, 
  Download, 
  ArrowUpDown, 
  Zap, 
  ShieldAlert, 
  Check, 
  ChevronRight, 
  RefreshCw,
  Sparkles,
  Info,
  ChevronDown,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface MilestoneAnalysisViewProps {
  milestones: Software3Milestone[];
  projects?: Project[];
  software2Projects?: Software2Project[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function MilestoneAnalysisView({
  milestones = [],
  projects = [],
  software2Projects = [],
  onRefresh,
  isLoading = false
}: MilestoneAnalysisViewProps) {
  // Filters state
  const [selectedVP, setSelectedVP] = useState<string>('all');
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [criticalOnly, setCriticalOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBottleneckFilter, setSelectedBottleneckFilter] = useState<string>('all');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sortField, setSortField] = useState<string>('isCritical');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Derive distinct filter dropdown options
  const vpOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.vp) set.add(m.vp); });
    projects.forEach(p => { if (p.vp) set.add(p.vp); });
    return Array.from(set).sort();
  }, [milestones, projects]);

  const leaderOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => {
      if (selectedVP === 'all' || m.vp === selectedVP) {
        if (m.leader) set.add(m.leader);
      }
    });
    return Array.from(set).sort();
  }, [milestones, selectedVP]);

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    milestones.forEach(m => {
      const matchVP = selectedVP === 'all' || m.vp === selectedVP;
      const matchLeader = selectedLeader === 'all' || m.leader === selectedLeader;
      if (matchVP && matchLeader && m.projectCode) {
        map.set(m.projectCode, m.projectName ? `${m.projectCode} - ${m.projectName}` : m.projectCode);
      }
    });
    return Array.from(map.entries()).map(([code, label]) => ({ code, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [milestones, selectedVP, selectedLeader]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.category) set.add(m.category); });
    return Array.from(set).sort();
  }, [milestones]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.month) set.add(m.month); });
    return Array.from(set).sort();
  }, [milestones]);

  // Filtered milestones list
  const filteredMilestones = useMemo(() => {
    return milestones.filter(item => {
      // 1. VP filter
      if (selectedVP !== 'all' && item.vp !== selectedVP) return false;

      // 2. Leader filter
      if (selectedLeader !== 'all' && item.leader !== selectedLeader) return false;

      // 3. Project filter
      if (selectedProject !== 'all' && item.projectCode !== selectedProject) return false;

      // 4. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // 5. Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'Done' && item.status !== 'Done') return false;
        if (selectedStatus === 'Not Done' && item.status === 'Done') return false;
      }

      // 6. Planned Week filter
      if (selectedWeek !== 'all' && item.plannedWeek !== selectedWeek) return false;

      // 7. Month filter
      if (selectedMonth !== 'all' && item.month !== selectedMonth) return false;

      // 8. Critical Only filter
      if (criticalOnly && !item.isCritical) return false;

      // 9. Bottleneck quick filter
      if (selectedBottleneckFilter !== 'all') {
        if (selectedBottleneckFilter === 'Work Front' && item.workFront !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Drawing' && item.drawing !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Material' && item.materialDelivery !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Labour' && item.labourAvailability !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Client Decision' && item.clientDecision !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Contractor App' && item.contractorApp !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Contractor Mob' && item.contractorMob !== 'Not Done') return false;
      }

      // 10. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = `${item.projectCode} ${item.projectName} ${item.milestone} ${item.leader} ${item.building} ${item.remark} ${item.primaryBottleneck}`.toLowerCase();
        if (!matchText.includes(q)) return false;
      }

      return true;
    });
  }, [
    milestones, 
    selectedVP, 
    selectedLeader, 
    selectedProject, 
    selectedCategory, 
    selectedStatus, 
    selectedWeek, 
    selectedMonth, 
    criticalOnly, 
    selectedBottleneckFilter, 
    searchQuery
  ]);

  // Statistics across current filtered view
  const stats = useMemo(() => {
    const total = filteredMilestones.length;
    let done = 0;
    let notDone = 0;
    let critical = 0;
    let criticalPending = 0;

    // 7 Bottlenecks counters
    let workFrontBlock = 0;
    let drawingBlock = 0;
    let materialBlock = 0;
    let labourBlock = 0;
    let clientDecisionBlock = 0;
    let contractorAppBlock = 0;
    let contractorMobBlock = 0;

    filteredMilestones.forEach(m => {
      if (m.status === 'Done') done++;
      else notDone++;

      if (m.isCritical) {
        critical++;
        if (m.status !== 'Done') criticalPending++;
      }

      if (m.status !== 'Done') {
        if (m.workFront === 'Not Done') workFrontBlock++;
        if (m.drawing === 'Not Done') drawingBlock++;
        if (m.materialDelivery === 'Not Done') materialBlock++;
        if (m.labourAvailability === 'Not Done') labourBlock++;
        if (m.clientDecision === 'Not Done') clientDecisionBlock++;
        if (m.contractorApp === 'Not Done') contractorAppBlock++;
        if (m.contractorMob === 'Not Done') contractorMobBlock++;
      }
    });

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Rank bottlenecks
    const bottlenecks = [
      { name: 'Work Front Availability', count: workFrontBlock, key: 'Work Front', color: 'rose' },
      { name: 'Drawing / GFC Release', count: drawingBlock, key: 'Drawing', color: 'amber' },
      { name: 'Material Delivery', count: materialBlock, key: 'Material', color: 'orange' },
      { name: 'Labour Availability', count: labourBlock, key: 'Labour', color: 'purple' },
      { name: 'Client Decision', count: clientDecisionBlock, key: 'Client Decision', color: 'blue' },
      { name: 'Contractor Appointment', count: contractorAppBlock, key: 'Contractor App', color: 'indigo' },
      { name: 'Contractor Mobilization', count: contractorMobBlock, key: 'Contractor Mob', color: 'teal' }
    ].sort((a, b) => b.count - a.count);

    return {
      total,
      done,
      notDone,
      critical,
      criticalPending,
      completionRate,
      bottlenecks
    };
  }, [filteredMilestones]);

  // Sorted and Paginated items
  const sortedMilestones = useMemo(() => {
    return [...filteredMilestones].sort((a, b) => {
      let valA: any = (a as any)[sortField];
      let valB: any = (b as any)[sortField];

      if (sortField === 'isCritical') {
        valA = a.isCritical ? 1 : 0;
        valB = b.isCritical ? 1 : 0;
      }

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(String(valB || ''));
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredMilestones, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedMilestones.length / pageSize) || 1;
  const paginatedMilestones = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMilestones.slice(start, start + pageSize);
  }, [sortedMilestones, currentPage, pageSize]);

  // Export filtered items to CSV
  const handleExportCSV = () => {
    const headers = [
      'Project ID', 'Project Name', 'Building', 'Leader', 'VP',
      'Milestone', 'Category', 'Status', 'Planned Week', 'Critical',
      'Pending From Month', 'Contractor App', 'Drawing', 'Work Front',
      'Contractor Mob', 'Material Delivery', 'Labour Availability',
      'Client Decision', 'Remark', 'Primary Bottleneck', 'Recommended Action'
    ];

    const rows = filteredMilestones.map(m => [
      `"${m.projectCode}"`,
      `"${m.projectName}"`,
      `"${m.building}"`,
      `"${m.leader}"`,
      `"${m.vp || ''}"`,
      `"${m.milestone.replace(/"/g, '""')}"`,
      `"${m.category}"`,
      `"${m.status}"`,
      `"${m.plannedWeek}"`,
      `"${m.isCritical ? 'Critical (C)' : 'No'}"`,
      `"${m.month}"`,
      `"${m.contractorApp}"`,
      `"${m.drawing}"`,
      `"${m.workFront}"`,
      `"${m.contractorMob}"`,
      `"${m.materialDelivery}"`,
      `"${m.labourAvailability}"`,
      `"${m.clientDecision}"`,
      `"${(m.remark || '').replace(/"/g, '""')}"`,
      `"${m.primaryBottleneck}"`,
      `"${(m.actionRecommendation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Milestone_Analysis_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl backdrop-blur-md">
                <Flag className="w-6 h-6 text-indigo-400" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-black tracking-tight">Milestone Analysis &amp; Bottleneck Diagnostics</h1>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Software 3 Live
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium">
                  Detailed category mapping, weekly planning schedules, 7-parameter constraint readings &amp; actionable bottleneck resolution
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Top 4 Primary Filters Row */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Filter 1: VP */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>VP Portfolio</span>
            </label>
            <select
              value={selectedVP}
              onChange={e => { setSelectedVP(e.target.value); setSelectedLeader('all'); setSelectedProject('all'); setCurrentPage(1); }}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All VPs (Consolidated)</option>
              {vpOptions.map(vp => (
                <option key={vp} value={vp}>VP: {vp}</option>
              ))}
            </select>
          </div>

          {/* Filter 2: Leader */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Team Leader</span>
            </label>
            <select
              value={selectedLeader}
              onChange={e => { setSelectedLeader(e.target.value); setSelectedProject('all'); setCurrentPage(1); }}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Leaders</option>
              {leaderOptions.map(l => (
                <option key={l} value={l}>Leader: {l}</option>
              ))}
            </select>
          </div>

          {/* Filter 3: Project */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Project</span>
            </label>
            <select
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Projects ({projectOptions.length})</option>
              {projectOptions.map(p => (
                <option key={p.code} value={p.code}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Filter 4: Category & Critical Toggle */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Milestone Category</span>
            </label>
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="Start">Start Milestones</option>
              <option value="50%">50% In-Progress Milestones</option>
              <option value="Finish">Finish / 100% Completion</option>
              {categoryOptions.filter(c => !['Start', '50%', 'Finish'].includes(c)).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Filter & Search Pills */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => { setSelectedStatus('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all ${selectedStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Status ({stats.total})
            </button>
            <button
              onClick={() => { setSelectedStatus('Not Done'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all ${selectedStatus === 'Not Done' ? 'bg-rose-50 text-rose-700 font-extrabold shadow-xs' : 'text-slate-600 hover:text-rose-600'}`}
            >
              Pending ({stats.notDone})
            </button>
            <button
              onClick={() => { setSelectedStatus('Done'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-lg transition-all ${selectedStatus === 'Done' ? 'bg-emerald-50 text-emerald-700 font-extrabold shadow-xs' : 'text-slate-600 hover:text-emerald-600'}`}
            >
              Done ({stats.done})
            </button>
          </div>

          {/* Week Filter */}
          <select
            value={selectedWeek}
            onChange={e => { setSelectedWeek(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">Planned Week: All</option>
            <option value="W1">Week 1 (W1)</option>
            <option value="W2">Week 2 (W2)</option>
            <option value="W3">Week 3 (W3)</option>
            <option value="W4">Week 4 (W4)</option>
          </select>

          {/* Month Pending Filter */}
          {monthOptions.length > 0 && (
            <select
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Pending Month: All</option>
              {monthOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Critical Only Toggle */}
          <button
            onClick={() => { setCriticalOnly(!criticalOnly); setCurrentPage(1); }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
              criticalOnly 
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm shadow-rose-200' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${criticalOnly ? 'text-white' : 'text-rose-600'}`} />
            <span>Critical Only ({stats.criticalPending} Pending)</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search milestones, projects, bottlenecks..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Intelligent Bottleneck Diagnostics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Completion Overview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Execution Status</span>
            <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
              stats.completionRate >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {stats.completionRate}% Done
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-3xl font-black text-slate-900">{stats.done}</span>
            <span className="text-sm font-bold text-slate-500">/ {stats.total} Milestones</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.completionRate}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Critical Lags */}
        <div className="bg-white rounded-2xl p-5 border border-rose-200 bg-rose-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-rose-700 uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>Critical Milestones</span>
            </span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              High Risk
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mb-2">
            <span className="text-3xl font-black text-rose-700">{stats.criticalPending}</span>
            <span className="text-sm font-bold text-slate-600">Pending this month</span>
          </div>
          <p className="text-[11px] text-rose-800 font-medium leading-tight">
            Milestones tagged &apos;C&apos; will compress schedule variance if not completed immediately.
          </p>
        </div>

        {/* KPI 3 & 4: Top Constraint Bottlenecks Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>7-Parameter Constraint Gap Diagnosis (Filterable)</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">Click pill to isolate</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {stats.bottlenecks.map(b => {
              const isSelected = selectedBottleneckFilter === b.key;
              return (
                <button
                  key={b.name}
                  onClick={() => setSelectedBottleneckFilter(isSelected ? 'all' : b.key)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : b.count > 0
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                      : 'bg-slate-50/50 text-slate-400 border-slate-100 opacity-60'
                  }`}
                >
                  <span>{b.name}:</span>
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : b.count > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {b.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Milestones Analysis Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>Detailed Milestone Line-Item Analysis</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {filteredMilestones.length} Records
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Readings across all 7 contractor, technical &amp; site enabling constraints
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500">Show:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
            >
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3.5">#</th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('projectCode')}>
                  <div className="flex items-center gap-1">
                    <span>Project</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5 cursor-pointer hover:text-slate-900" onClick={() => handleSort('milestone')}>
                  <div className="flex items-center gap-1">
                    <span>Milestone Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Week</th>
                <th className="py-3 px-3.5">Critical</th>
                <th className="py-3 px-3.5">Pending From</th>
                <th className="py-3 px-3.5">Status</th>
                {/* 7 Constraint Reading Columns */}
                <th className="py-3 px-2 text-center">Contractor App.</th>
                <th className="py-3 px-2 text-center">Drawing</th>
                <th className="py-3 px-2 text-center">Work Front</th>
                <th className="py-3 px-2 text-center">Contractor Mob.</th>
                <th className="py-3 px-2 text-center">Material</th>
                <th className="py-3 px-2 text-center">Labour</th>
                <th className="py-3 px-2 text-center">Client Dec.</th>
                <th className="py-3 px-3.5 min-w-[200px]">Bottleneck &amp; Line of Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMilestones.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-16 text-center text-slate-400 font-medium">
                    <Flag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">No milestones matching the selected criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or adjusting search keywords</p>
                  </td>
                </tr>
              ) : (
                paginatedMilestones.map((m, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isDone = m.status === 'Done';

                  const renderPill = (val: string) => {
                    if (val === 'Done') {
                      return <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-black text-[9px] leading-4 text-center">✓</span>;
                    }
                    if (val === 'Not Done') {
                      return <span className="inline-block w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-black text-[9px] leading-4 text-center">✕</span>;
                    }
                    return <span className="text-slate-300 font-bold">-</span>;
                  };

                  return (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${m.isCritical && !isDone ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-400 text-[10px]">{globalIdx}</td>

                      {/* Project ID & Info */}
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900">{m.projectCode}</span>
                          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]" title={m.projectName}>
                            {m.projectName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Lead: <strong>{m.leader || '—'}</strong> • Bldg: <strong>{m.building || '—'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Milestone Name */}
                      <td className="py-3 px-3.5 max-w-[220px]">
                        <span className="font-bold text-slate-800 leading-snug block" title={m.milestone}>
                          {m.milestone}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          m.category.toLowerCase().includes('start')
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : m.category.toLowerCase().includes('50')
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : m.category.toLowerCase().includes('finish') || m.category.toLowerCase().includes('100')
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {m.category}
                        </span>
                      </td>

                      {/* Week */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                        {m.plannedWeek || '—'}
                      </td>

                      {/* Critical Flag */}
                      <td className="py-3 px-3.5">
                        {m.isCritical ? (
                          <span className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase bg-rose-600 text-white shadow-xs">
                            Critical
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">—</span>
                        )}
                      </td>

                      {/* Pending Month */}
                      <td className="py-3 px-3.5 font-medium text-slate-600 text-[11px]">
                        {m.month || 'Current'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          isDone 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>

                      {/* 7 Checkpoints */}
                      <td className="py-3 px-2 text-center" title={`Contractor App.: ${m.contractorApp}`}>{renderPill(m.contractorApp)}</td>
                      <td className="py-3 px-2 text-center" title={`Drawing: ${m.drawing}`}>{renderPill(m.drawing)}</td>
                      <td className="py-3 px-2 text-center" title={`Work Front: ${m.workFront}`}>{renderPill(m.workFront)}</td>
                      <td className="py-3 px-2 text-center" title={`Contractor Mob.: ${m.contractorMob}`}>{renderPill(m.contractorMob)}</td>
                      <td className="py-3 px-2 text-center" title={`Material Delivery: ${m.materialDelivery}`}>{renderPill(m.materialDelivery)}</td>
                      <td className="py-3 px-2 text-center" title={`Labour Availability: ${m.labourAvailability}`}>{renderPill(m.labourAvailability)}</td>
                      <td className="py-3 px-2 text-center" title={`Client Decision: ${m.clientDecision}`}>{renderPill(m.clientDecision)}</td>

                      {/* Bottleneck & Line of Action */}
                      <td className="py-3 px-3.5">
                        <div className="space-y-1">
                          {!isDone && m.failingConstraints.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {m.failingConstraints.map(fc => (
                                <span key={fc} className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800">
                                  {fc}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <p className={`text-[11px] leading-tight font-medium ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {m.actionRecommendation}
                          </p>

                          {m.remark && (
                            <span className="text-[10px] text-slate-500 italic block">
                              Remark: {m.remark}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing {Math.min(filteredMilestones.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredMilestones.length, currentPage * pageSize)} of {filteredMilestones.length} milestones
            </span>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1 px-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
