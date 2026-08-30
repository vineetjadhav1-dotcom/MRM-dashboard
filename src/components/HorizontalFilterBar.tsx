import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActiveTab, Project, Software2Project, Software3Milestone } from '@/src/types';
import { useFilter } from '@/src/context/FilterContext';
import { sortVpNames, sortLeaderNames } from '@/src/utils/customOrder';
import { 
  Filter, 
  RotateCcw, 
  Search, 
  X, 
  Building2, 
  Building,
  Users, 
  Layers, 
  Flag, 
  Calendar, 
  AlertTriangle,
  ChevronDown,
  Check,
  Globe
} from 'lucide-react';

interface HorizontalFilterBarProps {
  activeTab: ActiveTab;
  projects?: Project[];
  software2Projects?: Software2Project[];
  software3Milestones?: Software3Milestone[];
}

// Helper to sort months chronologically
const parseMonthToChronologicalWeight = (mStr: string): number => {
  if (!mStr) return 9999;
  const clean = mStr.trim();
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const yearMatch = clean.match(/20(\d{2})|(\d{2})$/);
  let year = 26;
  if (yearMatch) year = parseInt(yearMatch[1] || yearMatch[2], 10);
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

// Reusable Searchable Dropdown Combobox with list, instant search, and vibrant active highlighting
export interface SearchableComboboxProps {
  id: string;
  icon: any;
  label: string;
  allLabel: string;
  selectedValue: string;
  onSelect: (val: string) => void;
  options: { value: string; label: string; subtext?: string }[];
  placeholder?: string;
  colorClass?: string;
  activeBgClass?: string;
}

export function SearchableCombobox({
  id,
  icon: Icon,
  label,
  allLabel,
  selectedValue,
  onSelect,
  options,
  placeholder = 'Search...',
  colorClass = 'text-blue-400',
  activeBgClass = 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
}: SearchableComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(q) || 
      o.value.toLowerCase().includes(q) ||
      (o.subtext && o.subtext.toLowerCase().includes(q))
    );
  }, [options, search]);

  const isFiltered = selectedValue !== 'all' && selectedValue !== '';

  const selectedDisplayLabel = useMemo(() => {
    if (!isFiltered) return allLabel;
    const match = options.find(o => o.value === selectedValue);
    return match ? match.label : selectedValue;
  }, [selectedValue, options, allLabel, isFiltered]);

  return (
    <div className="relative inline-block z-30" ref={containerRef} id={`combobox-container-${id}`}>
      {/* Combobox Trigger Button with Vibrant Active Color Highlighting */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 border rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs max-w-[220px] ${
          isFiltered 
            ? activeBgClass 
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-700 text-slate-200 hover:text-white'
        }`}
        title={`${label}: ${selectedDisplayLabel}`}
      >
        <Icon className={`w-3.5 h-3.5 shrink-0 ${isFiltered ? 'text-white' : colorClass}`} />
        <span className="truncate max-w-[145px]">{selectedDisplayLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 ml-0.5 transition-transform ${
          isFiltered ? 'text-white/80' : 'text-slate-400'
        } ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Floating Dropdown Menu with Instant Search Input */}
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-[9999] p-2 space-y-1.5 min-w-[260px] max-w-[340px] animate-in fade-in zoom-in-95 duration-100"
          style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Search text input inside dropdown */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-6 py-1.5 text-xs font-medium bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Scrollable list options */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            <button
              type="button"
              onClick={() => {
                onSelect('all');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-between ${
                selectedValue === 'all' ? 'bg-indigo-600 text-white font-black' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{allLabel}</span>
              {selectedValue === 'all' && <Check className="w-3.5 h-3.5 text-white" />}
            </button>

            {filteredOptions.map((opt) => {
              const isSelected = selectedValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-indigo-600 text-white font-bold' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                  title={opt.label}
                >
                  <div className="truncate pr-2 min-w-0">
                    <span className="block truncate">{opt.label}</span>
                    {opt.subtext && (
                      <span className={`text-[10px] block truncate ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{opt.subtext}</span>
                    )}
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="py-2.5 text-center text-xs text-slate-500 italic">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HorizontalFilterBar({
  activeTab,
  projects = [],
  software2Projects = [],
  software3Milestones = []
}: HorizontalFilterBarProps) {
  const {
    selectedVP,
    setSelectedVP,
    selectedLeader,
    setSelectedLeader,
    selectedProjectCode,
    setSelectedProjectCode,
    searchQuery,
    setSearchQuery,
    projectPlanType,
    setProjectPlanType,
    projectActiveMetric,
    setProjectActiveMetric,
    milestoneCategory,
    setMilestoneCategory,
    milestoneStatus,
    setMilestoneStatus,
    milestoneWeek,
    setMilestoneWeek,
    milestoneMonth,
    setMilestoneMonth,
    milestoneCriticalOnly,
    setMilestoneCriticalOnly,
    leaderboardCategory,
    setLeaderboardCategory,
    masterStage,
    setMasterStage,
    masterStatus,
    setMasterStatus,
    resetTabFilters
  } = useFilter();

  // Don't render filter bar on configuration or user management tabs
  if (activeTab === 'overview' || activeTab === 'userAccess') {
    return null;
  }

  // 1. Derive list of VPs with Custom Sequence KM, K-PK, K-KD, K-AS
  const vpList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => { if (p.vp) set.add(String(p.vp).trim()); });
    software2Projects.forEach(p => { if (p.vp) set.add(String(p.vp).trim()); });
    software3Milestones.forEach(m => { if (m.vp) set.add(String(m.vp).trim()); });
    return Array.from(set).sort(sortVpNames);
  }, [projects, software2Projects, software3Milestones]);

  const vpOptions = useMemo(() => {
    return vpList.map(vp => ({
      value: vp,
      label: `VP: ${vp}`,
      subtext: vp
    }));
  }, [vpList]);

  // 2. Derive list of Leaders with Custom Sequence SP, VB, MP, KM, GK, SD, K-PK, K-SS, K-AS, K-VK, K-ZK
  const leaderList = useMemo(() => {
    const set = new Set<string>();
    const checkMatchVP = (vp?: string) => selectedVP === 'all' || (vp && String(vp).trim() === selectedVP);

    projects.forEach(p => {
      if (checkMatchVP(p.vp) && p.leader) set.add(String(p.leader).trim());
    });
    software2Projects.forEach(p => {
      if (checkMatchVP(p.vp) && p.leader) set.add(String(p.leader).trim());
    });
    software3Milestones.forEach(m => {
      if (checkMatchVP(m.vp) && m.leader) set.add(String(m.leader).trim());
    });
    return Array.from(set).sort(sortLeaderNames);
  }, [projects, software2Projects, software3Milestones, selectedVP]);

  const leaderOptions = useMemo(() => {
    return leaderList.map(l => ({
      value: l,
      label: `Leader: ${l}`,
      subtext: l
    }));
  }, [leaderList]);

  // 3. Derive list of Projects (dynamically filtered by selected VP and Leader)
  const projectList = useMemo(() => {
    const map = new Map<string, { code: string; name: string; leader?: string; vp?: string }>();
    const checkMatch = (vp?: string, leader?: string) => {
      const matchVP = selectedVP === 'all' || (vp && String(vp).trim() === selectedVP);
      const matchLeader = selectedLeader === 'all' || (leader && String(leader).trim() === selectedLeader);
      return matchVP && matchLeader;
    };

    projects.forEach(p => {
      if (checkMatch(p.vp, p.leader) && p.code) {
        map.set(p.code, { code: p.code, name: p.name || p.code, leader: p.leader, vp: p.vp });
      }
    });
    software2Projects.forEach(p => {
      if (checkMatch(p.vp, p.leader) && p.code) {
        if (!map.has(p.code)) map.set(p.code, { code: p.code, name: p.name || p.code, leader: p.leader, vp: p.vp });
      }
    });
    software3Milestones.forEach(m => {
      if (checkMatch(m.vp, m.leader) && m.projectCode) {
        if (!map.has(m.projectCode)) map.set(m.projectCode, { code: m.projectCode, name: m.projectName || m.projectCode, leader: m.leader, vp: m.vp });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, software2Projects, software3Milestones, selectedVP, selectedLeader]);

  const projectOptions = useMemo(() => {
    return projectList.map(p => ({
      value: p.code,
      label: p.name,
      subtext: `${p.code} • ${p.leader || 'No Leader'}`
    }));
  }, [projectList]);

  // 4. Derive Milestone Months
  const milestoneMonths = useMemo(() => {
    const set = new Set<string>();
    software3Milestones.forEach(m => { if (m.month) set.add(m.month.trim()); });
    return Array.from(set).sort((a, b) => parseMonthToChronologicalWeight(a) - parseMonthToChronologicalWeight(b));
  }, [software3Milestones]);

  // 5. Derive Stages (for master projects)
  const stageList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => { if (p.projectStage) set.add(String(p.projectStage).trim()); });
    return Array.from(set).sort();
  }, [projects]);

  // Handler for Organization Click: Resets VP, Leader, Project to 'all' to show entire org's data
  const handleOrganizationClick = () => {
    setSelectedVP('all');
    setSelectedLeader('all');
    setSelectedProjectCode('all');
  };

  // Handler for VP change
  const handleVPChange = (vp: string) => {
    setSelectedVP(vp);
    setSelectedProjectCode('all');
    if (selectedLeader !== 'all') {
      const match = leaderList.includes(selectedLeader);
      if (!match) setSelectedLeader('all');
    }
  };

  // Handler for Leader change
  const handleLeaderChange = (leader: string) => {
    setSelectedLeader(leader);
    setSelectedProjectCode('all');
  };

  // Is entire Organization selected (i.e. no VP, Leader, or Project filter active)
  const isOrgSelected = selectedVP === 'all' && selectedLeader === 'all' && selectedProjectCode === 'all';

  // Check if any filter is active for the current tab
  const hasActiveFilters = useMemo(() => {
    if (selectedVP !== 'all' || selectedLeader !== 'all' || selectedProjectCode !== 'all' || searchQuery.trim() !== '') return true;
    if (activeTab === 'projectDashboard' && projectPlanType !== 'r0') return true;
    if (activeTab === 'milestones' && (milestoneCategory !== 'all' || milestoneStatus !== 'all' || milestoneWeek !== 'all' || milestoneMonth !== 'all' || milestoneCriticalOnly)) return true;
    if (activeTab === 'all' && (masterStage !== 'all' || masterStatus !== 'all')) return true;
    return false;
  }, [
    activeTab, 
    selectedVP, 
    selectedLeader, 
    selectedProjectCode, 
    searchQuery, 
    projectPlanType, 
    milestoneCategory, 
    milestoneStatus, 
    milestoneWeek, 
    milestoneMonth, 
    milestoneCriticalOnly, 
    masterStage, 
    masterStatus
  ]);

  return (
    <div 
      className="bg-slate-800/95 backdrop-blur-md border-b border-slate-700/80 px-3 sm:px-6 py-1 text-white shadow-xs relative z-50 overflow-visible transition-all"
      id="horizontal-filter-bar"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2.5 min-w-max h-8 sm:h-9 overflow-visible">
        
        {/* Left Side: Only "Filter" title */}
        <div className="flex items-center space-x-1.5 shrink-0 text-slate-300 pr-1">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-black tracking-wider uppercase text-slate-200">Filter</span>
        </div>

        {/* Dynamic 1-Line Window-Specific Filters:
            Sequence: 1. Organization -> 2. VP -> 3. Leader -> 4. Project
            Active filters are highlighted in distinct vibrant colors! */}
        <div className="flex items-center space-x-2 shrink-0 overflow-visible">

          {/* 1. ORGANIZATION FILTER (Clicking removes VP, Leader, Project filters & shows entire org data) */}
          <button
            type="button"
            onClick={handleOrganizationClick}
            className={`flex items-center space-x-1.5 rounded-xl px-2.5 py-1 text-xs font-black transition-all cursor-pointer shadow-2xs border ${
              isOrgSelected
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
            }`}
            title="Display entire Organization data (Clears VP, Leader, and Project filters)"
          >
            <Building className={`w-3.5 h-3.5 ${isOrgSelected ? 'text-white' : 'text-emerald-400'}`} />
            <span>Organization</span>
            {isOrgSelected && <Check className="w-3 h-3 text-white ml-0.5" />}
          </button>

          {/* 2. EXECUTIVE VP FILTER (Sequence: KM, K-PK, K-KD, K-AS; Highlighted in Blue when active) */}
          <SearchableCombobox
            id={`${activeTab}-vp`}
            icon={Building2}
            label="Executive VP"
            allLabel="All VPs"
            selectedValue={selectedVP}
            onSelect={handleVPChange}
            options={vpOptions}
            placeholder="Search VP (KM, K-PK, K-KD, K-AS)..."
            colorClass="text-blue-400"
            activeBgClass="bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-400/40"
          />

          {/* 3. PROJECT LEADER FILTER (Sequence: SP, VB, MP, KM, GK, SD, K-PK, K-SS, K-AS, K-VK, K-ZK; Highlighted in Purple when active) */}
          <SearchableCombobox
            id={`${activeTab}-leader`}
            icon={Users}
            label="Project Leader"
            allLabel="All Leaders"
            selectedValue={selectedLeader}
            onSelect={handleLeaderChange}
            options={leaderOptions}
            placeholder="Search leader (SP, VB, MP...)..."
            colorClass="text-purple-400"
            activeBgClass="bg-purple-600 text-white border-purple-400 shadow-md ring-2 ring-purple-400/40"
          />

          {/* 4. PROJECTS FILTER (Dynamically filtered by selected VP/Leader; Highlighted in Amber when active) - Not shown on Leaderboard tab */}
          {activeTab !== 'leaderboard' && (
            <SearchableCombobox
              id={`${activeTab}-project`}
              icon={Layers}
              label="Project"
              allLabel={`All Projects (${projectList.length})`}
              selectedValue={selectedProjectCode}
              onSelect={setSelectedProjectCode}
              options={projectOptions}
              placeholder="Search project name/code..."
              colorClass="text-amber-400"
              activeBgClass="bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400/40"
            />
          )}

          {/* ========================================================================= */}
          {/* TAB-SPECIFIC SECONDARY CONTROLS                                          */}
          {/* ========================================================================= */}

          {/* Project Dashboard Secondary Controls */}
          {activeTab === 'projectDashboard' && (
            <>
              {/* Plan Phase Switcher */}
              <div className="inline-flex p-0.5 bg-slate-900/90 rounded-xl border border-slate-700 text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setProjectPlanType('r0')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    projectPlanType === 'r0'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  R0 Baseline
                </button>
                <button
                  type="button"
                  onClick={() => setProjectPlanType('r1')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    projectPlanType === 'r1'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  R1 Revised
                </button>
              </div>

              {/* Metric Switcher Pills */}
              <div className="hidden lg:inline-flex p-0.5 bg-slate-900/90 rounded-xl border border-slate-700 text-[11px] font-extrabold">
                {[
                  { key: 'vowd', label: 'VOWD' },
                  { key: 'milestone', label: 'Milestones' },
                  { key: 'labour', label: 'Labour' },
                  { key: 'ur', label: 'UR' },
                  { key: 'uc', label: 'UC' }
                ].map(m => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setProjectActiveMetric(m.key as any)}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      projectActiveMetric === m.key
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Milestone Analysis Secondary Controls */}
          {activeTab === 'milestones' && (
            <>
              {/* Category Filter */}
              <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-0.5 text-xs">
                <Flag className="w-3 h-3 text-amber-400 shrink-0" />
                <select
                  value={milestoneCategory}
                  onChange={(e) => setMilestoneCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">All Categories</option>
                  <option value="Start" className="bg-slate-900 text-white">Start</option>
                  <option value="50%" className="bg-slate-900 text-white">50% In-Progress</option>
                  <option value="Finish" className="bg-slate-900 text-white">Finish</option>
                </select>
              </div>

              {/* Status 1-Click Toggle */}
              <div className="inline-flex p-0.5 bg-slate-900/90 rounded-xl border border-slate-700 text-[10.5px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setMilestoneStatus('all')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    milestoneStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMilestoneStatus('Not Done')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    milestoneStatus === 'Not Done' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-rose-400'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setMilestoneStatus('Done')}
                  className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                    milestoneStatus === 'Done' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-400'
                  }`}
                >
                  Done
                </button>
              </div>

              {/* Planned Week Selector */}
              <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-0.5 text-xs">
                <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                <select
                  value={milestoneWeek}
                  onChange={(e) => setMilestoneWeek(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">All Weeks</option>
                  <option value="W1" className="bg-slate-900 text-white">W1</option>
                  <option value="W2" className="bg-slate-900 text-white">W2</option>
                  <option value="W3" className="bg-slate-900 text-white">W3</option>
                  <option value="W4" className="bg-slate-900 text-white">W4</option>
                </select>
              </div>

              {/* Pending Month Selector */}
              {milestoneMonths.length > 0 && (
                <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-0.5 text-xs">
                  <select
                    value={milestoneMonth}
                    onChange={(e) => setMilestoneMonth(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Months</option>
                    {milestoneMonths.map(m => (
                      <option key={m} value={m} className="bg-slate-900 text-white">Pending: {m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Critical Only Toggle */}
              <button
                type="button"
                onClick={() => setMilestoneCriticalOnly(!milestoneCriticalOnly)}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                  milestoneCriticalOnly
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle Critical Milestones Only"
              >
                <AlertTriangle className={`w-3.5 h-3.5 ${milestoneCriticalOnly ? 'text-rose-200' : 'text-rose-400'}`} />
                <span>Critical Only</span>
              </button>
            </>
          )}

          {/* Leaderboard Category Tabs */}
          {activeTab === 'leaderboard' && (
            <div className="inline-flex p-0.5 bg-slate-900/90 rounded-xl border border-slate-700 text-[11px] font-extrabold">
              <button
                type="button"
                onClick={() => setLeaderboardCategory('VP')}
                className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardCategory === 'VP' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Executive VPs
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardCategory('LEADER')}
                className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardCategory === 'LEADER' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Project Leaders
              </button>
              <button
                type="button"
                onClick={() => setLeaderboardCategory('PROJECT')}
                className={`px-2.5 py-0.5 rounded-lg transition-all cursor-pointer ${
                  leaderboardCategory === 'PROJECT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Projects
              </button>
            </div>
          )}

          {/* Master Projects Stage/Status Controls */}
          {activeTab === 'all' && (
            <>
              <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-0.5 text-xs">
                <select
                  value={masterStage}
                  onChange={(e) => setMasterStage(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">All Stages</option>
                  {stageList.map(stg => (
                    <option key={stg} value={stg} className="bg-slate-900 text-white">{stg}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-slate-900/80 border border-slate-700 rounded-xl px-2 py-0.5 text-xs">
                <select
                  value={masterStatus}
                  onChange={(e) => setMasterStatus(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all" className="bg-slate-900 text-white">All Status</option>
                  <option value="Green" className="bg-slate-900 text-white">Green</option>
                  <option value="Amber" className="bg-slate-900 text-white">Amber</option>
                  <option value="Red" className="bg-slate-900 text-white">Red</option>
                  <option value="Gray" className="bg-slate-900 text-white">Gray</option>
                </select>
              </div>
            </>
          )}

          {/* Global Quick Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-6 py-1 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-32 sm:w-40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

        {/* Right Action: Reset Filter Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => resetTabFilters(activeTab)}
            className="flex items-center space-x-1 px-2 py-1 bg-slate-900/90 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 rounded-xl text-xs font-bold border border-slate-700 hover:border-rose-800 transition-all cursor-pointer shrink-0"
            title="Reset active window filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

      </div>
    </div>
  );
}
