import { useState, useMemo } from 'react';
import { Project } from '@/src/types';
import { sortVpNames, sortLeaderNames } from '@/src/utils/customOrder';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  User, 
  MapPin, 
  Eye, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Building2,
  Bookmark
} from 'lucide-react';

interface ProjectListTableProps {
  projects: Project[];
  onProjectSelect: (proj: Project) => void;
}

type SortField = 'code' | 'name' | 'leader' | 'vp' | 'area' | 'status' | 'targetDate';
type SortOrder = 'asc' | 'desc';

export default function ProjectListTable({ projects, onProjectSelect }: ProjectListTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVP, setSelectedVP] = useState('All');
  const [selectedLeader, setSelectedLeader] = useState('All');
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Dynamically populate filter options with custom order
  const vps = useMemo(() => {
    const list = new Set(projects.map(p => p.vp).filter(Boolean));
    return ['All', ...Array.from(list).sort(sortVpNames)];
  }, [projects]);

  const leaders = useMemo(() => {
    const list = new Set(projects.map(p => p.leader).filter(Boolean));
    return ['All', ...Array.from(list).sort(sortLeaderNames)];
  }, [projects]);

  const areas = useMemo(() => {
    const list = new Set(projects.map(p => p.area).filter(Boolean));
    return ['All', ...Array.from(list).sort()];
  }, [projects]);

  const statuses = useMemo(() => {
    const list = new Set(projects.map(p => p.status).filter(Boolean));
    return ['All', ...Array.from(list).sort()];
  }, [projects]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and Sort Projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Apply Search Query (Search across code, name, leader, vp, area, and updates)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        p => 
          (p.code && String(p.code).toLowerCase().includes(query)) ||
          (p.name && String(p.name).toLowerCase().includes(query)) ||
          (p.leader && String(p.leader).toLowerCase().includes(query)) ||
          (p.vp && String(p.vp).toLowerCase().includes(query)) ||
          (p.area && String(p.area).toLowerCase().includes(query)) ||
          (p.update && String(p.update).toLowerCase().includes(query))
      );
    }

    // Apply VP Filter
    if (selectedVP !== 'All') {
      result = result.filter(p => p.vp === selectedVP);
    }

    // Apply Leader Filter
    if (selectedLeader !== 'All') {
      result = result.filter(p => p.leader === selectedLeader);
    }

    // Apply Area Filter
    if (selectedArea !== 'All') {
      result = result.filter(p => p.area === selectedArea);
    }

    // Apply Status Filter
    if (selectedStatus !== 'All') {
      result = result.filter(p => p.status === selectedStatus);
    }

    // Apply Sort
    result.sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (sortField === 'code') {
        // Handle alphanumeric comparison
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' })
          : valB.localeCompare(valA, undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [projects, searchQuery, selectedVP, selectedLeader, selectedArea, selectedStatus, sortField, sortOrder]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedVP('All');
    setSelectedLeader('All');
    setSelectedArea('All');
    setSelectedStatus('All');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans" id="projects-table-view">
      {/* Header and Search Filters Bar */}
      <div className="p-6 border-b border-slate-200 space-y-4 bg-slate-50/40" id="projects-filter-bar">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">Project Registry Matrix</h3>
            <p className="text-xs text-slate-500">Search, filter, and drill down into operational records</p>
          </div>
          {(searchQuery || selectedVP !== 'All' || selectedLeader !== 'All' || selectedArea !== 'All' || selectedStatus !== 'All') && (
            <button
              id="reset-filters-btn"
              onClick={resetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Reset active filters
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="filters-container">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              id="table-search-input"
              type="text"
              placeholder="Search Project ID, title, owner, update text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* VP Filter */}
          <div className="relative">
            <select
              id="filter-vp"
              value={selectedVP}
              onChange={(e) => setSelectedVP(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="All">All VPs</option>
              {vps.filter(vp => vp !== 'All').map(vp => (
                <option key={vp} value={vp}>{vp}</option>
              ))}
            </select>
          </div>

          {/* Leader Filter */}
          <div className="relative">
            <select
              id="filter-leader"
              value={selectedLeader}
              onChange={(e) => setSelectedLeader(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="All">All Leaders</option>
              {leaders.filter(l => l !== 'All').map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
            >
              <option value="All">All Statuses</option>
              {statuses.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto" id="table-container">
        {filteredAndSortedProjects.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center" id="empty-table-state">
            <div className="bg-slate-50 p-4 rounded-full border border-slate-100 mb-4">
              <Filter className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-800">No projects match your current filters</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Try broadening your search query or setting the reporting filters to &quot;All&quot;.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-700" id="projects-table">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th 
                  onClick={() => handleSort('code')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[140px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1">
                    <span>Project Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('leader')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[150px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Leader</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('vp')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[150px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Sponsor VP</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('area')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap w-[150px]"
                >
                  <div className="flex items-center space-x-1">
                    <span>Area</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap text-center w-[120px]"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap text-right w-[80px]">
                  <span>Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 bg-white" id="table-body">
              {filteredAndSortedProjects.map((proj) => (
                <tr 
                  key={proj.code} 
                  onClick={() => onProjectSelect(proj)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                >
                  {/* Code */}
                  <td className="px-6 py-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                    {proj.code}
                  </td>
                  
                  {/* Name and Progress bar */}
                  <td className="px-6 py-4">
                    <div className="space-y-1.5 max-w-[320px]">
                      <p className="font-semibold text-slate-900 truncate" title={proj.name}>
                        {proj.name}
                      </p>
                      
                      {/* Dynamic Progress Indicator */}
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div 
                            style={{ width: proj.progress && proj.progress.includes('%') ? proj.progress : '0%' }}
                            className={`h-full ${
                              proj.status === 'Green' ? 'bg-emerald-500' :
                              proj.status === 'Amber' ? 'bg-amber-400' :
                              proj.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <span>{proj.progress || '0%'} Complete</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Leader */}
                  <td className="px-6 py-4 font-medium text-slate-800 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{proj.leader}</span>
                    </div>
                  </td>
                  
                  {/* VP */}
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap font-medium">
                    {proj.vp}
                  </td>
                  
                  {/* Area */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 border border-slate-200 text-slate-600 rounded-lg">
                      {proj.area}
                    </span>
                  </td>
                  
                  {/* Status RAG badge */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      proj.status === 'Green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      proj.status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      proj.status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                        proj.status === 'Green' ? 'bg-emerald-500' :
                        proj.status === 'Amber' ? 'bg-amber-500' :
                        proj.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
                      }`} />
                      {proj.status}
                    </span>
                  </td>
                  
                  {/* Action */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button 
                      id={`view-btn-${proj.code}`}
                      className="inline-flex items-center px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3 mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer statistics line */}
      <div className="bg-slate-50 p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center" id="table-footer-summary">
        <span>Showing {filteredAndSortedProjects.length} of {projects.length} loaded records</span>
        <span className="font-mono text-[10px]">Filter Match Ratio: {projects.length > 0 ? Math.round((filteredAndSortedProjects.length / projects.length) * 100) : 0}%</span>
      </div>
    </div>
  );
}
