import { useState, useMemo } from 'react';
import { VPData, Project } from '@/src/types';
import { useFilter } from '@/src/context/FilterContext';
import { isCompleteOrLostStage, isTempProject } from '@/src/utils/customOrder';
import { 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle
} from 'lucide-react';

interface VPListProps {
  vpDataList: VPData[];
  onProjectSelect: (proj: Project) => void;
}

export default function VPList({ vpDataList, onProjectSelect }: VPListProps) {
  const { selectedVP, searchQuery } = useFilter();
  const [expandedVP, setExpandedVP] = useState<string | null>(null);

  const toggleExpand = (vpName: string) => {
    setExpandedVP(expandedVP === vpName ? null : vpName);
  };

  const filteredVps = useMemo(() => {
    return vpDataList.filter(vp => {
      const matchVP = selectedVP === 'all' || vp.name.trim().toLowerCase() === selectedVP.trim().toLowerCase();
      const matchQuery = !searchQuery.trim() || 
        vp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vp.projects.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchVP && matchQuery;
    });
  }, [vpDataList, selectedVP, searchQuery]);

  return (
    <div className="space-y-4 font-sans" id="vp-portfolio-list">
      {/* Header Banner - Uniform Light Grey Block */}
      <div className="bg-slate-100/80 border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs flex items-center space-x-3.5" id="vp-header-banner">
        <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl shadow-2xs shrink-0">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Executive VP Portfolios</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Rollup metrics and direct reports grouped by VP sponsorship</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4" id="vps-container">
        {filteredVps.map((vp) => {
          const isExpanded = expandedVP === vp.name;
          const greenCount = vp.statusCounts['Green'] || 0;
          const amberCount = vp.statusCounts['Amber'] || 0;
          const redCount = vp.statusCounts['Red'] || 0;
          const grayCount = vp.statusCounts['Gray'] || 0;

          const greenPct = vp.projectsCount > 0 ? Math.round((greenCount / vp.projectsCount) * 100) : 0;
          const amberPct = vp.projectsCount > 0 ? Math.round((amberCount / vp.projectsCount) * 100) : 0;
          const redPct = vp.projectsCount > 0 ? Math.round((redCount / vp.projectsCount) * 100) : 0;
          const grayPct = vp.projectsCount > 0 ? Math.round((grayCount / vp.projectsCount) * 100) : 0;

          return (
            <div 
              key={vp.name} 
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
              id={`vp-card-${vp.name.replace(/\s+/g, '-')}`}
            >
              {/* Header Panel */}
              <div 
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => toggleExpand(vp.name)}
              >
                {/* VP Identity */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{vp.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{vp.projectsCount} Projects</span>
                      <span>•</span>
                      <Users className="w-3.5 h-3.5" />
                      <span>{vp.leaders.size} Reporting Leaders</span>
                    </p>
                  </div>
                </div>

                {/* Portfolio Status Bar & Toggles */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 w-full md:w-auto">
                  {/* Status counts bar */}
                  <div className="flex flex-col space-y-1.5 min-w-[200px]">
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
                      <span>RAG Delivery Index</span>
                      <span className="text-slate-700">{Math.round(greenPct)}% On Track</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                      {greenCount > 0 && <div style={{ width: `${greenPct}%` }} className="bg-emerald-500 h-full" />}
                      {amberCount > 0 && <div style={{ width: `${amberPct}%` }} className="bg-amber-400 h-full" />}
                      {redCount > 0 && <div style={{ width: `${redPct}%` }} className="bg-rose-500 h-full" />}
                      {grayCount > 0 && <div style={{ width: `${grayPct}%` }} className="bg-slate-400 h-full" />}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Status badges */}
                    <div className="flex items-center space-x-2 text-xs">
                      {greenCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" /> {greenCount}
                        </span>
                      )}
                      {amberCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-100 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1 shrink-0" /> {amberCount}
                        </span>
                      )}
                      {redCount > 0 && (
                        <span className="px-2 py-0.5 rounded-md font-semibold bg-rose-50 text-rose-800 border border-rose-100 flex items-center">
                          <XCircle className="w-3 h-3 mr-1 shrink-0" /> {redCount}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Collapsed Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50/40" id={`vp-expanded-${vp.name.replace(/\s+/g, '-')}`}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Summary statistics breakdown */}
                    <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block border-b border-slate-100 pb-2 mb-3">
                          Portfolio Insights
                        </span>
                        <div className="space-y-2.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Sponsor Portfolio Share</span>
                            <span className="font-semibold text-slate-800">
                              {vpDataList.length > 0 ? Math.round((vp.projectsCount / vpDataList.reduce((acc, curr) => acc + curr.projectsCount, 0)) * 100) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Primary Leaders</span>
                            <span className="font-semibold text-slate-800">{vp.leaders.size} Active</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strategic Areas Coverage</span>
                            <span className="font-semibold text-slate-800">{vp.areas.size} Verticals</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                          Direct Report Leaders
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from(vp.leaders).map((lead) => (
                            <span key={lead} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg font-medium border border-slate-200">
                              {lead}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Project list under VP */}
                    <div className="lg:col-span-2 space-y-2.5">
                      {(() => {
                        const cardProjects = vp.projects.filter(p => !isTempProject(p.code) && !isCompleteOrLostStage(p.projectStage));
                        return (
                          <>
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                              Assigned Project Directory ({cardProjects.length})
                            </span>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1" id="vp-project-scroll">
                              {cardProjects.map((proj) => (
                                <div 
                                  key={proj.code} 
                                  onClick={() => onProjectSelect(proj)}
                                  className="bg-white border border-slate-100 rounded-xl p-3.5 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-left"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-mono text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                                        {proj.code}
                                      </span>
                                      <span className="text-xs font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
                                        {proj.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-[10px] text-slate-500 font-medium">
                                      <span className="flex items-center">
                                        <Users className="w-3 h-3 mr-1 text-slate-400" /> Lead: {proj.leader}
                                      </span>
                                      <span className="flex items-center">
                                        <Layers className="w-3 h-3 mr-1 text-slate-400" /> Area: {proj.area}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3 shrink-0">
                                    {/* RAG Pill */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                      proj.status === 'Green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                      proj.status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      proj.status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                      'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}>
                                      {proj.status}
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-slate-300" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
