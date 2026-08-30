import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ActiveTab, Project, Software2Project, Software3Milestone } from '@/src/types';

export interface FilterContextType {
  // Common filters
  selectedVP: string;
  setSelectedVP: (vp: string) => void;
  selectedLeader: string;
  setSelectedLeader: (leader: string) => void;
  selectedProjectCode: string;
  setSelectedProjectCode: (proj: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // 1. Project Dashboard filters
  projectPlanType: 'r0' | 'r1';
  setProjectPlanType: (pt: 'r0' | 'r1') => void;
  projectActiveMetric: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';
  setProjectActiveMetric: (metric: 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc') => void;

  // 2. Leader Review / MRM filters
  leaderStage: string;
  setLeaderStage: (stage: string) => void;

  // 3. Milestone Analysis filters
  milestoneCategory: string;
  setMilestoneCategory: (cat: string) => void;
  milestoneStatus: string;
  milestoneStatusFilter: string;
  setMilestoneStatus: (status: string) => void;
  milestoneWeek: string;
  setMilestoneWeek: (week: string) => void;
  milestoneMonth: string;
  setMilestoneMonth: (month: string) => void;
  milestoneCriticalOnly: boolean;
  setMilestoneCriticalOnly: (crit: boolean) => void;
  milestoneBottleneckFilter: string;
  setMilestoneBottleneckFilter: (bn: string) => void;

  // 4. Key Insights & Forecast filters
  insightsMetric: 'vowd' | 'milestone' | 'labour';
  setInsightsMetric: (m: 'vowd' | 'milestone' | 'labour') => void;
  insightsScenario: 'all' | 'optimistic' | 'mostLikely' | 'pessimistic';
  setInsightsScenario: (sc: 'all' | 'optimistic' | 'mostLikely' | 'pessimistic') => void;

  // 5. Leaderboard filters
  leaderboardCategory: 'VP' | 'LEADER' | 'PROJECT';
  setLeaderboardCategory: (cat: 'VP' | 'LEADER' | 'PROJECT') => void;

  // 6. All Projects Master filters
  masterStage: string;
  setMasterStage: (stage: string) => void;
  masterStatus: string;
  setMasterStatus: (status: string) => void;

  // Global Reset
  resetTabFilters: (tab: ActiveTab) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Common state
  const [selectedVP, setSelectedVP] = useState<string>('all');
  const [selectedLeader, setSelectedLeader] = useState<string>('all');
  const [selectedProjectCode, setSelectedProjectCode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Project Dashboard state
  const [projectPlanType, setProjectPlanType] = useState<'r0' | 'r1'>('r0');
  const [projectActiveMetric, setProjectActiveMetric] = useState<'vowd' | 'milestone' | 'labour' | 'ur' | 'uc'>('vowd');

  // 2. Leader Review state
  const [leaderStage, setLeaderStage] = useState<string>('all');

  // 3. Milestone Analysis state
  const [milestoneCategory, setMilestoneCategory] = useState<string>('all');
  const [milestoneStatus, setMilestoneStatus] = useState<string>('all');
  const [milestoneWeek, setMilestoneWeek] = useState<string>('all');
  const [milestoneMonth, setMilestoneMonth] = useState<string>('all');
  const [milestoneCriticalOnly, setMilestoneCriticalOnly] = useState<boolean>(false);
  const [milestoneBottleneckFilter, setMilestoneBottleneckFilter] = useState<string>('all');

  // 4. Key Insights state
  const [insightsMetric, setInsightsMetric] = useState<'vowd' | 'milestone' | 'labour'>('vowd');
  const [insightsScenario, setInsightsScenario] = useState<'all' | 'optimistic' | 'mostLikely' | 'pessimistic'>('all');

  // 5. Leaderboard state
  const [leaderboardCategory, setLeaderboardCategory] = useState<'VP' | 'LEADER' | 'PROJECT'>('VP');

  // 6. Master Projects state
  const [masterStage, setMasterStage] = useState<string>('all');
  const [masterStatus, setMasterStatus] = useState<string>('all');

  const resetTabFilters = (tab: ActiveTab) => {
    setSelectedVP('all');
    setSelectedLeader('all');
    setSelectedProjectCode('all');
    setSearchQuery('');

    if (tab === 'projectDashboard') {
      setProjectPlanType('r0');
      setProjectActiveMetric('vowd');
    } else if (tab === 'leader') {
      setLeaderStage('all');
    } else if (tab === 'milestones') {
      setMilestoneCategory('all');
      setMilestoneStatus('all');
      setMilestoneWeek('all');
      setMilestoneMonth('all');
      setMilestoneCriticalOnly(false);
      setMilestoneBottleneckFilter('all');
    } else if (tab === 'insights') {
      setInsightsMetric('vowd');
      setInsightsScenario('all');
    } else if (tab === 'leaderboard') {
      setLeaderboardCategory('VP');
    } else if (tab === 'all') {
      setMasterStage('all');
      setMasterStatus('all');
    }
  };

  const value = useMemo(() => ({
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
    leaderStage,
    setLeaderStage,
    milestoneCategory,
    setMilestoneCategory,
    milestoneStatus,
    milestoneStatusFilter: milestoneStatus,
    setMilestoneStatus,
    milestoneWeek,
    setMilestoneWeek,
    milestoneMonth,
    setMilestoneMonth,
    milestoneCriticalOnly,
    setMilestoneCriticalOnly,
    milestoneBottleneckFilter,
    setMilestoneBottleneckFilter,
    insightsMetric,
    setInsightsMetric,
    insightsScenario,
    setInsightsScenario,
    leaderboardCategory,
    setLeaderboardCategory,
    masterStage,
    setMasterStage,
    masterStatus,
    setMasterStatus,
    resetTabFilters
  }), [
    selectedVP,
    selectedLeader,
    selectedProjectCode,
    searchQuery,
    projectPlanType,
    projectActiveMetric,
    leaderStage,
    milestoneCategory,
    milestoneStatus,
    milestoneWeek,
    milestoneMonth,
    milestoneCriticalOnly,
    milestoneBottleneckFilter,
    insightsMetric,
    insightsScenario,
    leaderboardCategory,
    masterStage,
    masterStatus
  ]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
