import React, { useState, useMemo } from 'react';
import { Software3Milestone, Project, Software2Project } from '@/src/types';
import { useFilter } from '@/src/context/FilterContext';
import { sortVpNames, sortLeaderNames } from '@/src/utils/customOrder';
import { SearchableCombobox } from './HorizontalFilterBar';
import { 
  Search, 
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
  FileSpreadsheet,
  BarChart3,
  TrendingDown,
  AlertCircle,
  BrainCircuit,
  Target,
  ArrowUpRight,
  PieChart as PieIcon,
  Activity,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Filter,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  LabelList,
  CartesianGrid,
  Legend,
  ComposedChart,
  Line
} from 'recharts';

interface MilestoneAnalysisViewProps {
  milestones: Software3Milestone[];
  projects?: Project[];
  software2Projects?: Software2Project[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

// Helper to sort months chronologically (e.g. Apr 26 -> May 26 -> Jun 26 -> Jul 26 -> Aug 26)
const parseMonthToChronologicalWeight = (mStr: string): number => {
  if (!mStr) return 9999;
  const clean = mStr.trim();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Look for 2-digit or 4-digit year e.g. 26 or 2026
  const yearMatch = clean.match(/20(\d{2})|(\d{2})$/);
  let year = 26; // Default FY base year 2026
  if (yearMatch) {
    year = parseInt(yearMatch[1] || yearMatch[2], 10);
  }

  // Find month index
  const mLower = clean.toLowerCase();
  let mIdx = -1;
  for (let i = 0; i < months.length; i++) {
    if (mLower.includes(months[i])) {
      mIdx = i;
      break;
    }
  }

  if (mIdx === -1) return 9999;
  return year * 12 + mIdx;
};

export default function MilestoneAnalysisView({
  milestones = [],
  projects = [],
  software2Projects = [],
  onRefresh,
  isLoading = false
}: MilestoneAnalysisViewProps) {
  // Filters state from global FilterContext
  const {
    selectedVP,
    setSelectedVP,
    selectedLeader,
    setSelectedLeader,
    selectedProjectCode: selectedProject,
    setSelectedProjectCode: setSelectedProject,
    milestoneCategory: selectedCategory,
    setMilestoneCategory: setSelectedCategory,
    milestoneStatus: selectedStatus,
    setMilestoneStatus: setSelectedStatus,
    milestoneWeek: selectedWeek,
    setMilestoneWeek: setSelectedWeek,
    milestoneMonth: selectedMonth,
    setMilestoneMonth: setSelectedMonth,
    milestoneCriticalOnly: criticalOnly,
    setMilestoneCriticalOnly: setCriticalOnly,
    milestoneBottleneckFilter: selectedBottleneckFilter,
    setMilestoneBottleneckFilter: setSelectedBottleneckFilter,
    searchQuery,
    setSearchQuery
  } = useFilter();

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortField, setSortField] = useState<string>('isCritical');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Active sub-view tab: 'overview' | 'intelligence'
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'intelligence'>('overview');

  // Derive distinct filter dropdown options
  const vpOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.vp) set.add(m.vp); });
    projects.forEach(p => { if (p.vp) set.add(p.vp); });
    return Array.from(set).sort(sortVpNames);
  }, [milestones, projects]);

  const leaderOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => {
      if (selectedVP === 'all' || m.vp === selectedVP) {
        if (m.leader) set.add(m.leader);
      }
    });
    return Array.from(set).sort(sortLeaderNames);
  }, [milestones, selectedVP]);

  const projectOptions = useMemo(() => {
    const map = new Map<string, { code: string; label: string; leader?: string; vp?: string }>();
    milestones.forEach(m => {
      const matchVP = selectedVP === 'all' || m.vp === selectedVP;
      const matchLeader = selectedLeader === 'all' || m.leader === selectedLeader;
      if (matchVP && matchLeader && m.projectCode) {
        map.set(m.projectCode, { 
          code: m.projectCode, 
          label: m.projectName ? m.projectName : m.projectCode,
          leader: m.leader,
          vp: m.vp
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [milestones, selectedVP, selectedLeader]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.category) set.add(m.category); });
    return Array.from(set).sort();
  }, [milestones]);

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    milestones.forEach(m => { if (m.month) set.add(m.month); });
    return Array.from(set).sort((a, b) => parseMonthToChronologicalWeight(a) - parseMonthToChronologicalWeight(b));
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

      // 9. Bottleneck quick filter (across all 10 constraints)
      if (selectedBottleneckFilter !== 'all') {
        if (selectedBottleneckFilter === 'Work Front' && item.workFront !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Drawing' && item.drawing !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Material' && item.materialDelivery !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Labour' && item.labourAvailability !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Client Decision' && item.clientDecision !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Contractor App' && item.contractorApp !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Contractor Mob' && item.contractorMob !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Govt Approval' && item.govtApproval !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'CRM' && item.crm !== 'Not Done') return false;
        if (selectedBottleneckFilter === 'Other' && item.other !== 'Not Done') return false;
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

  // Comprehensive statistics, graphical aggregates & intelligent insights calculation
  const stats = useMemo(() => {
    const total = filteredMilestones.length;
    let done = 0;
    let notDone = 0;
    let critical = 0;
    let criticalPending = 0;

    // 10 Bottlenecks counters (7 site enabling + Govt Approval, CRM, Other)
    let workFrontBlock = 0;
    let drawingBlock = 0;
    let materialBlock = 0;
    let labourBlock = 0;
    let clientDecisionBlock = 0;
    let contractorAppBlock = 0;
    let contractorMobBlock = 0;
    let govtApprovalBlock = 0;
    let crmBlock = 0;
    let otherBlock = 0;

    // Month aging map for pending milestones
    const monthAgingMap = new Map<string, { month: string; total: number; critical: number; normal: number }>();

    // Week distribution map
    const weekMap = new Map<string, { week: string; done: number; pending: number; critical: number; total: number }>();
    ['W1', 'W2', 'W3', 'W4'].forEach(w => weekMap.set(w, { week: w, done: 0, pending: 0, critical: 0, total: 0 }));

    // Consolidated Category map (Start, 50%, Finish, General)
    const categoryMap = new Map<string, { category: string; done: number; pending: number; total: number; achPct: number }>();

    // Leader critical count
    const leaderCriticalMap = new Map<string, { leader: string; criticalCount: number; pendingCount: number }>();

    // VP critical count
    const vpCriticalMap = new Map<string, { vp: string; criticalCount: number; pendingCount: number }>();

    filteredMilestones.forEach(m => {
      const isDone = m.status === 'Done';
      if (isDone) done++;
      else notDone++;

      if (m.isCritical) {
        critical++;
        if (!isDone) criticalPending++;
      }

      // Month Aging aggregation (for pending items)
      if (!isDone) {
        const mKey = m.month && m.month.trim() ? m.month.trim() : 'Current';
        if (!monthAgingMap.has(mKey)) {
          monthAgingMap.set(mKey, { month: mKey, total: 0, critical: 0, normal: 0 });
        }
        const mEntry = monthAgingMap.get(mKey)!;
        mEntry.total++;
        if (m.isCritical) mEntry.critical++;
        else mEntry.normal++;
      }

      // Week distribution
      const wKey = m.plannedWeek && m.plannedWeek.trim() ? m.plannedWeek.trim().toUpperCase() : 'W1';
      if (weekMap.has(wKey)) {
        const wEntry = weekMap.get(wKey)!;
        wEntry.total++;
        if (isDone) wEntry.done++;
        else {
          wEntry.pending++;
          if (m.isCritical) wEntry.critical++;
        }
      }

      // Consolidated Category distribution (Start, 50%, Finish)
      let catKey = 'General';
      const c = (m.category || '').toLowerCase();
      if (c.includes('start')) catKey = 'Start';
      else if (c.includes('50')) catKey = '50%';
      else if (c.includes('finish') || c.includes('100') || c.includes('complete')) catKey = 'Finish';
      else if (m.category) catKey = m.category;

      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, { category: catKey, done: 0, pending: 0, total: 0, achPct: 0 });
      }
      const catEntry = categoryMap.get(catKey)!;
      catEntry.total++;
      if (isDone) catEntry.done++;
      else catEntry.pending++;

      // Leader & VP Risk
      if (!isDone && m.leader) {
        const lEntry = leaderCriticalMap.get(m.leader) || { leader: m.leader, criticalCount: 0, pendingCount: 0 };
        lEntry.pendingCount++;
        if (m.isCritical) lEntry.criticalCount++;
        leaderCriticalMap.set(m.leader, lEntry);
      }
      if (!isDone && m.vp) {
        const vEntry = vpCriticalMap.get(m.vp) || { vp: m.vp, criticalCount: 0, pendingCount: 0 };
        vEntry.pendingCount++;
        if (m.isCritical) vEntry.criticalCount++;
        vpCriticalMap.set(m.vp, vEntry);
      }

      // 10 Constraints checks
      if (!isDone) {
        if (m.workFront === 'Not Done') workFrontBlock++;
        if (m.drawing === 'Not Done') drawingBlock++;
        if (m.materialDelivery === 'Not Done') materialBlock++;
        if (m.labourAvailability === 'Not Done') labourBlock++;
        if (m.clientDecision === 'Not Done') clientDecisionBlock++;
        if (m.contractorApp === 'Not Done') contractorAppBlock++;
        if (m.contractorMob === 'Not Done') contractorMobBlock++;
        if (m.govtApproval === 'Not Done') govtApprovalBlock++;
        if (m.crm === 'Not Done') crmBlock++;
        if (m.other === 'Not Done') otherBlock++;
      }
    });

    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Rank 10 bottlenecks
    const bottlenecks = [
      { name: 'Work Front Availability', count: workFrontBlock, key: 'Work Front', color: '#f43f5e', pct: notDone > 0 ? Math.round((workFrontBlock / notDone) * 100) : 0 },
      { name: 'Drawing / GFC Release', count: drawingBlock, key: 'Drawing', color: '#f59e0b', pct: notDone > 0 ? Math.round((drawingBlock / notDone) * 100) : 0 },
      { name: 'Material Delivery', count: materialBlock, key: 'Material', color: '#ea580c', pct: notDone > 0 ? Math.round((materialBlock / notDone) * 100) : 0 },
      { name: 'Labour Availability', count: labourBlock, key: 'Labour', color: '#8b5cf6', pct: notDone > 0 ? Math.round((labourBlock / notDone) * 100) : 0 },
      { name: 'Client Decision', count: clientDecisionBlock, key: 'Client Decision', color: '#3b82f6', pct: notDone > 0 ? Math.round((clientDecisionBlock / notDone) * 100) : 0 },
      { name: 'Contractor Appointment', count: contractorAppBlock, key: 'Contractor App', color: '#6366f1', pct: notDone > 0 ? Math.round((contractorAppBlock / notDone) * 100) : 0 },
      { name: 'Contractor Mobilization', count: contractorMobBlock, key: 'Contractor Mob', color: '#0d9488', pct: notDone > 0 ? Math.round((contractorMobBlock / notDone) * 100) : 0 },
      { name: 'Govt Approval / NOC', count: govtApprovalBlock, key: 'Govt Approval', color: '#0284c7', pct: notDone > 0 ? Math.round((govtApprovalBlock / notDone) * 100) : 0 },
      { name: 'CRM Handover', count: crmBlock, key: 'CRM', color: '#ec4899', pct: notDone > 0 ? Math.round((crmBlock / notDone) * 100) : 0 },
      { name: 'Other Constraints', count: otherBlock, key: 'Other', color: '#64748b', pct: notDone > 0 ? Math.round((otherBlock / notDone) * 100) : 0 }
    ].sort((a, b) => b.count - a.count);

    // Chronological order: 1st block oldest month (e.g. Apr 26) -> last block current month (e.g. Aug 26)
    const pendingMonthsAging = Array.from(monthAgingMap.values()).sort((a, b) => {
      return parseMonthToChronologicalWeight(a.month) - parseMonthToChronologicalWeight(b.month);
    });

    // Consolidated Category distribution array sorted by predefined sequence: Start -> 50% -> Finish -> Other
    const predefinedCatOrder = ['Start', '50%', 'Finish'];
    const consolidatedCategoryData = Array.from(categoryMap.values())
      .map(item => ({
        ...item,
        achPct: item.total > 0 ? Math.round((item.done / item.total) * 100) : 0
      }))
      .sort((a, b) => {
        const idxA = predefinedCatOrder.indexOf(a.category);
        const idxB = predefinedCatOrder.indexOf(b.category);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return b.total - a.total;
      });

    // Weekly distribution array
    const weeklyData = Array.from(weekMap.values());

    // Top critical leaders & VPs
    const topCriticalLeaders = Array.from(leaderCriticalMap.values()).sort((a, b) => b.criticalCount - a.criticalCount);
    const topCriticalVPs = Array.from(vpCriticalMap.values()).sort((a, b) => b.criticalCount - a.criticalCount);

    // Intelligent Summary Computations
    const chronicBacklogCount = pendingMonthsAging
      .filter(pm => pm.month.toLowerCase().includes('apr') || pm.month.toLowerCase().includes('may') || pm.month.toLowerCase().includes('jun'))
      .reduce((sum, pm) => sum + pm.total, 0);

    const topBlocker = bottlenecks[0] || { name: 'None', count: 0, pct: 0 };
    const secondBlocker = bottlenecks[1] || { name: 'None', count: 0, pct: 0 };

    return {
      total,
      done,
      notDone,
      critical,
      criticalPending,
      completionRate,
      bottlenecks,
      pendingMonthsAging,
      consolidatedCategoryData,
      weeklyData,
      topCriticalLeaders,
      topCriticalVPs,
      chronicBacklogCount,
      topBlocker,
      secondBlocker
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
      'Project Name', 'Building', 'Leader', 'VP',
      'Milestone', 'Category', 'Status', 'Planned Week', 'Critical',
      'Pending From Month', 'Contractor App', 'Drawing', 'Work Front',
      'Contractor Mob', 'Material Delivery', 'Labour Availability',
      'Client Decision', 'Govt Approval', 'CRM', 'Other', 'Remark', 'Primary Bottleneck', 'Recommended Action'
    ];

    const rows = filteredMilestones.map(m => [
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
      `"${m.govtApproval || 'Done'}"`,
      `"${m.crm || 'Done'}"`,
      `"${m.other || 'Done'}"`,
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

  // Toggle Category selection on graph/card click
  const handleCategoryClick = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory('all');
    } else {
      setSelectedCategory(catName);
    }
    setCurrentPage(1);
  };

  // Toggle Constraint selection on graph/pill click
  const handleConstraintClick = (constraintKey: string) => {
    if (selectedBottleneckFilter === constraintKey) {
      setSelectedBottleneckFilter('all');
    } else {
      setSelectedBottleneckFilter(constraintKey);
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 pb-16 font-sans" id="milestone-analysis-root">
      
      {/* Header Banner - Uniform Light Grey Block */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative overflow-hidden" id="milestones-main-header">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl shadow-2xs shrink-0">
            <Flag className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Milestone Analysis &amp; Backlog Diagnostics
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Consolidated category stages, chronological pending aging &amp; 10-parameter site constraint diagnostics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setActiveAnalysisTab('overview')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeAnalysisTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Graphical Analytics</span>
            </button>
            <button
              onClick={() => setActiveAnalysisTab('intelligence')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeAnalysisTab === 'intelligence'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Executive Intelligence</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
            title="Download filtered milestones as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              title="Synchronize live spreadsheet data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Live</span>
            </button>
          )}
        </div>
      </div>

      {/* TOTAL MILESTONE SUMMARY METRICS (Plan & Achievement Counts) - Harmonized MRM Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="milestone-top-summary-kpis">
        
        {/* 1. Total Milestones (Plan) */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Total Milestones</span>
            <span className="text-indigo-700 font-black bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
              Plan Target
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs font-bold text-slate-500">Planned Deliverables</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Includes master plan &amp; backlog</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* 2. Total Achievement */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Total Achievement</span>
            <span className="text-emerald-700 font-black bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
              {stats.completionRate}% Met
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.done}</span>
            <span className="text-xs font-bold text-slate-500">/ {stats.total} Completed</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Fully signed-off &amp; delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* 3. Total Pending / Backlog */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Pending Backlog</span>
            <span className="text-rose-700 font-black bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">
              {stats.total > 0 ? Math.round((stats.notDone / stats.total) * 100) : 0}% Backlog
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.notDone}</span>
            <span className="text-xs font-bold text-slate-500">/ {stats.total} Pending</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending across aging months</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        {/* 4. Critical Milestones */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center text-xs font-black text-slate-700 uppercase tracking-wider">
            <span>Critical Milestones</span>
            <span className="text-amber-800 font-black bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
              {stats.criticalPending} Pending
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{stats.critical}</span>
            <span className="text-xs font-bold text-slate-500">Critical Deliverables</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>High priority critical path</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
        </div>

      </div>

      {/* 2. PENDING MONTHS AGING & BACKLOG HIGHLIGHTS (1st block = Apr 26, Last block = Aug 26) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </span>
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Pending Months Aging &amp; Backlog Highlights
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Chronological sequence from oldest month (Apr 26) to current month (Aug 26). Click any block to filter:
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {selectedMonth !== 'all' && (
              <button
                onClick={() => setSelectedMonth('all')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer flex items-center gap-1"
              >
                <span>Clear Month Filter ({selectedMonth})</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Total Pending Backlog: {stats.notDone} nos
            </span>
          </div>
        </div>

        {/* Dynamic Chronological Month Backlog Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {stats.pendingMonthsAging.length === 0 ? (
            <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
              No pending milestone backlog across historical months.
            </div>
          ) : (
            stats.pendingMonthsAging.map((pm, index) => {
              const isSelected = selectedMonth === pm.month;
              const isFirstOldest = index === 0;
              const isLastCurrent = index === stats.pendingMonthsAging.length - 1;

              return (
                <button
                  key={pm.month}
                  onClick={() => setSelectedMonth(isSelected ? 'all' : pm.month)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500 ring-offset-1'
                      : isFirstOldest
                      ? 'bg-rose-50/90 hover:bg-rose-100 text-rose-950 border-rose-200 hover:border-rose-300'
                      : isLastCurrent
                      ? 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 border-emerald-200 hover:border-emerald-300'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${
                      isSelected ? 'text-indigo-200' : isFirstOldest ? 'text-rose-700' : isLastCurrent ? 'text-emerald-700' : 'text-slate-500'
                    }`}>
                      {isFirstOldest ? 'Oldest Backlog' : isLastCurrent ? 'Current Month' : 'Pending Month'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-base font-black tracking-tight">
                      {pm.month}
                    </span>
                    <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : isFirstOldest
                        ? 'bg-rose-600 text-white' 
                        : isLastCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-900'
                    }`}>
                      {pm.total} nos
                    </span>
                  </div>

                  <div className="mt-2.5 text-[10px] flex items-center justify-between pt-1.5 border-t border-black/5">
                    <span className={isSelected ? 'text-white/80' : 'text-slate-500'}>
                      {isFirstOldest ? 'High Aging Priority' : isLastCurrent ? 'Active Cycle' : 'Historical Backlog'}
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'translate-x-0.5 text-white' : 'text-slate-400 group-hover:translate-x-0.5'}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 3. GRAPHICAL ANALYSIS SECTION (CONSOLIDATED CATEGORY ANALYSIS + 10 CONSTRAINTS) */}
      {activeAnalysisTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Row 1: Consolidated Category Graphical Analysis + 10-Parameter Constraint Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* CHART 1: Consolidated Milestone Category Graphical Analysis (Click to filter table) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <BarChart3 className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        Consolidated Milestone Category Analysis
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any category card/bar to instantly isolate and list those milestones below:
                    </p>
                  </div>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-lg border border-indigo-200 cursor-pointer"
                    >
                      Clear Category ({selectedCategory})
                    </button>
                  )}
                </div>

                {/* Interactive Category Metric Summary Cards */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {stats.consolidatedCategoryData.slice(0, 3).map((cat) => {
                    const isStart = cat.category.toLowerCase().includes('start');
                    const is50 = cat.category.includes('50');
                    const isFinish = cat.category.toLowerCase().includes('finish') || cat.category.includes('100');
                    const isCategoryActive = selectedCategory === cat.category;

                    return (
                      <div 
                        key={cat.category}
                        onClick={() => handleCategoryClick(cat.category)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isCategoryActive
                            ? 'ring-2 ring-indigo-600 bg-indigo-50/80 border-indigo-400 shadow-sm'
                            : isStart ? 'bg-blue-50/40 hover:bg-blue-50 border-blue-200' :
                            is50 ? 'bg-amber-50/40 hover:bg-amber-50 border-amber-200' :
                            'bg-emerald-50/40 hover:bg-emerald-50 border-emerald-200'
                        }`}
                        title={`Click to filter table by ${cat.category} milestones`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-slate-800 flex items-center gap-1">
                            <span>{cat.category}</span>
                            {isCategoryActive && <Check className="w-3 h-3 text-indigo-600" />}
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                            isStart ? 'bg-blue-100 text-blue-800' :
                            is50 ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cat.achPct}%
                          </span>
                        </div>
                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-base font-black text-slate-900">
                            {cat.total} <span className="text-[10px] font-normal text-slate-500">total</span>
                          </span>
                          <span className="text-xs font-bold text-slate-600">
                            <strong className="text-emerald-700">{cat.done}</strong> / <strong className="text-rose-600">{cat.pending}</strong>
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              isStart ? 'bg-blue-600' : is50 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${cat.achPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Recharts Consolidated Category Bar Chart */}
                <div className="h-[210px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stats.consolidatedCategoryData} 
                      margin={{ top: 15, right: 20, left: -20, bottom: 5 }}
                      onClick={(e: any) => {
                        if (e && e.activeLabel) {
                          handleCategoryClick(String(e.activeLabel));
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} fontWeight={800} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 14px' }}
                        formatter={(val: any, name: any) => [
                          `${val} Milestones`, 
                          name === 'done' ? 'Achieved (Done)' : 'Pending Backlog'
                        ]}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '8px' }}
                      />
                      <Bar dataKey="done" name="Achieved (Done)" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer">
                        <LabelList dataKey="done" position="top" fill="#047857" fontSize={10.5} fontWeight={900} />
                      </Bar>
                      <Bar dataKey="pending" name="Pending Backlog" fill="#64748b" radius={[4, 4, 0, 0]} cursor="pointer">
                        <LabelList dataKey="pending" position="top" fill="#334155" fontSize={10.5} fontWeight={900} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Footnote */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 flex-wrap gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <strong>Green Bar:</strong> Achieved Milestones (Done)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                  <strong>Slate Bar:</strong> Remaining Pending Milestones
                </span>
              </div>
            </div>

            {/* CHART 2: 10-Parameter Site & Technical Constraint Gap Diagnostics (Click to filter table) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Zap className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        10-Parameter Constraint Breakdown
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click any constraint bar or pill to isolate milestones blocked by that specific roadblock:
                    </p>
                  </div>
                  {selectedBottleneckFilter !== 'all' && (
                    <button
                      onClick={() => setSelectedBottleneckFilter('all')}
                      className="text-[11px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 cursor-pointer"
                    >
                      Clear Constraint ({selectedBottleneckFilter})
                    </button>
                  )}
                </div>

                {/* Constraint Horizontal Bar Chart */}
                <div className="h-[240px] w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={stats.bottlenecks} 
                      layout="vertical" 
                      margin={{ top: 0, right: 35, left: 10, bottom: 0 }}
                      onClick={(e: any) => {
                        if (e && e.activePayload && e.activePayload[0]) {
                          const payload = e.activePayload[0].payload;
                          if (payload && payload.key) {
                            handleConstraintClick(payload.key);
                          }
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#334155" fontSize={9.5} fontWeight={700} width={140} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                        formatter={(val: any, _, item: any) => [`${val} Blocked Milestones (${item.payload.pct}% of pending)`, 'Constraint Count']}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} cursor="pointer">
                        {stats.bottlenecks.map((entry, index) => (
                          <Cell 
                            key={`cell-bn-${index}`} 
                            fill={selectedBottleneckFilter === entry.key ? '#4f46e5' : entry.color} 
                          />
                        ))}
                        <LabelList dataKey="count" position="right" fill="#0f172a" fontSize={10} fontWeight={900} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 10 Blocker Filter Pills */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                {stats.bottlenecks.map(b => (
                  <button
                    key={b.key}
                    onClick={() => handleConstraintClick(b.key)}
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      selectedBottleneckFilter === b.key
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {b.key}: {b.count}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Row 2: Weekly Planned Execution Trajectory (W1 to W4) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Weekly Planned Execution Trajectory (W1 to W4)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Milestone delivery velocity split across the 4 execution weeks of the month
                  </p>
                </div>
              </div>
            </div>

            <div className="h-[200px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={11} fontWeight={800} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} fontWeight={700} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                  <Bar dataKey="done" name="Achieved (Done)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#64748b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* 4. INTELLIGENT EXECUTIVE AI DIAGNOSTICS TAB */}
      {activeAnalysisTab === 'intelligence' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: Critical Milestone Escalation Summary */}
            <div className="bg-gradient-to-br from-rose-950 to-slate-900 rounded-3xl p-5 text-white border border-rose-800/40 shadow-lg">
              <div className="flex items-center space-x-2.5 mb-3">
                <span className="p-2 bg-rose-600/30 rounded-xl border border-rose-500/40">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-rose-200">Critical Milestone Radar</h3>
                  <p className="text-[11px] text-rose-300">Unachievable in Current Month</p>
                </div>
              </div>

              <div className="my-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-rose-400">{stats.criticalPending}</span>
                  <span className="text-xs font-bold text-slate-300">Milestones Flagged Critical</span>
                </div>
                <p className="text-xs text-rose-200/90 mt-2 leading-relaxed font-medium">
                  {stats.criticalPending > 0 
                    ? `These ${stats.criticalPending} milestones have been verified as unattainable within the current monthly cycle and will slip into next month's review unless immediate trade interventions occur.`
                    : 'All planned milestones are currently tracking within feasible monthly recovery thresholds.'}
                </p>
              </div>

              <div className="pt-3 border-t border-rose-800/40 text-[11px] text-rose-300 flex items-center justify-between">
                <span>Critical Ratio:</span>
                <strong className="text-white font-extrabold">
                  {stats.notDone > 0 ? Math.round((stats.criticalPending / stats.notDone) * 100) : 0}% of Total Backlog
                </strong>
              </div>
            </div>

            {/* Card 2: Chronic Aging Analysis */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Chronic Backlog Aging</h3>
                    <p className="text-[11px] text-slate-500">Aging from Early Quarters</p>
                  </div>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-amber-600">{stats.chronicBacklogCount}</span>
                    <span className="text-xs font-bold text-slate-600">Chronic Backlog (nos)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Milestones pending from early quarters (April, May, June) carry significant cost escalation risk and require dedicated de-snagging squads.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Dominant Constraint:</span>
                <strong className="text-slate-900 font-bold">{stats.topBlocker.name}</strong>
              </div>
            </div>

            {/* Card 3: Top Blocker Root Cause Correlation */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Zap className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">#1 Constraint Driver</h3>
                    <p className="text-[11px] text-slate-500">Primary Blocker Correlation</p>
                  </div>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-black text-indigo-600">{stats.topBlocker.count}</span>
                    <span className="text-xs font-bold text-slate-600">Blocked on {stats.topBlocker.name}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    <strong>{stats.topBlocker.name}</strong> accounts for <strong>{stats.topBlocker.pct}%</strong> of all pending site delays, followed by <strong>{stats.secondBlocker.name}</strong> ({stats.secondBlocker.pct}%).
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Top 2 Combined:</span>
                <strong className="text-indigo-700 font-extrabold">{stats.topBlocker.pct + stats.secondBlocker.pct}% of Total Issues</strong>
              </div>
            </div>

          </div>

          {/* Strategic Executive Directive Box */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-indigo-800/40 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-black tracking-tight text-white">
                Planedge Strategic Recovery Directives for MRM Review
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-slate-200">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-rose-300 block mb-1 uppercase tracking-wider text-[11px]">
                  1. Critical Milestone Escalation
                </span>
                For the {stats.criticalPending} critical milestones unachievable in the current month, schedule mandatory joint sessions between Project Leaders and Executive VPs within 48 hours.
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-amber-300 block mb-1 uppercase tracking-wider text-[11px]">
                  2. Constraint Resolution Priority
                </span>
                Immediately expedite <strong className="text-white">{stats.topBlocker.name}</strong> and <strong className="text-white">{stats.secondBlocker.name}</strong> approvals with client project management teams.
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <span className="font-bold text-emerald-300 block mb-1 uppercase tracking-wider text-[11px]">
                  3. Quota Recovery Target
                </span>
                Maintain a weekly closing velocity of at least {Math.ceil(stats.notDone / 4)} milestones/week to liquidate historical backlog before next quarter.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MAIN DETAILED MILESTONE LINE-ITEM TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Detailed Milestone Line-Item Records</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {filteredMilestones.length} Records
                </span>
              </h3>

              {/* Active Graph Selection Indicator Chips */}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                  <span>Category: <strong>{selectedCategory}</strong></span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-indigo-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedBottleneckFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold">
                  <span>Constraint: <strong>{selectedBottleneckFilter}</strong></span>
                  <button onClick={() => setSelectedBottleneckFilter('all')} className="hover:text-rose-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedMonth !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
                  <span>Pending From: <strong>{selectedMonth}</strong></span>
                  <button onClick={() => setSelectedMonth('all')} className="hover:text-amber-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              Detailed tracking across all 10 site, contractor, technical &amp; administrative enabling constraints
            </p>
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            {/* Search Input in Table Header */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-500">Show:</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value={15}>15 rows</option>
                <option value={25}>25 rows</option>
                <option value={50}>50 rows</option>
                <option value={100}>100 rows</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-3 text-center">#</th>
                
                {/* 1. Project Column (Only Project Name & Leader - No Project ID) */}
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('projectName')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Project</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                {/* 2. Building Column (Separate column right next to Project) */}
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('building')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Building</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                {/* 3. Milestone Name */}
                <th className="py-3 px-3 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('milestone')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Milestone Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>

                <th className="py-3 px-2.5 text-center">Category</th>
                <th className="py-3 px-2.5 text-center">Week</th>
                <th className="py-3 px-2.5 text-center" title="Critical = Will NOT be achieved in current month">Critical</th>
                <th className="py-3 px-2.5 text-center cursor-pointer hover:text-slate-900" onClick={() => handleSort('month')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Pending</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-2.5 text-center">Status</th>

                {/* 10 Constraint Reading Columns */}
                <th className="py-3 px-1.5 text-center" title="Contractor Appointment">Contractor App.</th>
                <th className="py-3 px-1.5 text-center" title="Drawing / GFC Release">Drawing</th>
                <th className="py-3 px-1.5 text-center" title="Work Front Availability">Work Front</th>
                <th className="py-3 px-1.5 text-center" title="Contractor Mobilization">Contractor Mob.</th>
                <th className="py-3 px-1.5 text-center" title="Material Delivery">Material</th>
                <th className="py-3 px-1.5 text-center" title="Labour Availability">Labour</th>
                <th className="py-3 px-1.5 text-center" title="Client Decision">Client Dec.</th>
                <th className="py-3 px-1.5 text-center" title="Govt Approval / NOC">Govt App.</th>
                <th className="py-3 px-1.5 text-center" title="CRM Handover Clearance">CRM</th>
                <th className="py-3 px-1.5 text-center" title="Other Constraints">Other</th>

                <th className="py-3 px-3 min-w-[200px] text-center">Bottleneck &amp; Line of Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMilestones.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-16 text-center text-slate-400 font-medium">
                    <Flag className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700">No milestones matching the selected criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting category, constraint, or month filters</p>
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
                      <td className="py-3 px-3 font-bold text-slate-400 text-[10px] text-center">{globalIdx}</td>

                      {/* 1. Project Column: Project Name (No Project ID) + Leader */}
                      <td className="py-3 px-3 max-w-[170px] text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-extrabold text-slate-900 leading-snug truncate max-w-full" title={m.projectName}>
                            {m.projectName || m.projectCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Lead: <strong>{m.leader || '—'}</strong>
                          </span>
                        </div>
                      </td>

                      {/* 2. Separate Building Column */}
                      <td className="py-3 px-3 max-w-[110px] text-center">
                        <span className="font-bold text-slate-700 truncate block text-[11px] mx-auto" title={m.building}>
                          {m.building || '—'}
                        </span>
                      </td>

                      {/* 3. Milestone Name */}
                      <td className="py-3 px-3 max-w-[210px] text-center">
                        <span className="font-bold text-slate-800 leading-snug block mx-auto" title={m.milestone}>
                          {m.milestone}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase border inline-block ${
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
                      <td className="py-3 px-2.5 font-mono font-bold text-slate-700 text-center">
                        {m.plannedWeek || '—'}
                      </td>

                      {/* Critical Flag */}
                      <td className="py-3 px-2.5 text-center">
                        {m.isCritical ? (
                          <span 
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white shadow-xs"
                            title="Critical: Will NOT be achieved in current month"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 mr-0.5 text-rose-200" />
                            <span>C</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">—</span>
                        )}
                      </td>

                      {/* Pending Month */}
                      <td className="py-3 px-2.5 font-bold text-slate-700 text-[10.5px] text-center">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 inline-block">
                          {m.month || 'Current'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-2.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-black uppercase border inline-block ${
                          isDone 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {m.status}
                        </span>
                      </td>

                      {/* 10 Constraint Checkpoints */}
                      <td className="py-3 px-1.5 text-center" title={`Contractor App.: ${m.contractorApp}`}>{renderPill(m.contractorApp)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Drawing: ${m.drawing}`}>{renderPill(m.drawing)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Work Front: ${m.workFront}`}>{renderPill(m.workFront)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Contractor Mob.: ${m.contractorMob}`}>{renderPill(m.contractorMob)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Material Delivery: ${m.materialDelivery}`}>{renderPill(m.materialDelivery)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Labour Availability: ${m.labourAvailability}`}>{renderPill(m.labourAvailability)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Client Decision: ${m.clientDecision}`}>{renderPill(m.clientDecision)}</td>
                      <td className="py-3 px-1.5 text-center" title={`Govt Approval: ${m.govtApproval || 'Done'}`}>{renderPill(m.govtApproval || 'Done')}</td>
                      <td className="py-3 px-1.5 text-center" title={`CRM: ${m.crm || 'Done'}`}>{renderPill(m.crm || 'Done')}</td>
                      <td className="py-3 px-1.5 text-center" title={`Other: ${m.other || 'Done'}`}>{renderPill(m.other || 'Done')}</td>

                      {/* Bottleneck & Line of Action */}
                      <td className="py-3 px-3 text-center">
                        <div className="space-y-1 max-w-[260px] mx-auto text-center">
                          {!isDone && m.failingConstraints.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center">
                              {m.failingConstraints.map(fc => (
                                <span key={fc} className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-100 text-rose-800">
                                  {fc}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <p className={`text-[10.5px] leading-tight font-medium ${isDone ? 'text-emerald-700' : 'text-slate-700'}`}>
                            {m.actionRecommendation}
                          </p>

                          {m.remark && (
                            <span className="text-[9.5px] text-slate-500 italic block">
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
