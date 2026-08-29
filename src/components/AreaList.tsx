import { useState } from 'react';
import { AreaData, Project } from '@/src/types';
import { isCompleteOrLostStage, isTempProject } from '@/src/utils/customOrder';
import { 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Briefcase, 
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle
} from 'lucide-react';

interface AreaListProps {
  areaDataList: AreaData[];
  onProjectSelect: (proj: Project) => void;
}

export default function AreaList({ areaDataList, onProjectSelect }: AreaListProps) {
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const toggleExpand = (areaName: string) => {
    setExpandedArea(expandedArea === areaName ? null : areaName);
  };

  return (
    <div className="space-y-4 font-sans" id="area-performance-list">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2">
        <div>
          <h3 className="text-base font-bold text-slate-900">Strategic Focus Areas</h3>
          <p className="text-xs text-slate-500">Cross-functional delivery performance metrics organized by vertical domains</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="areas-grid">
        {areaDataList.map((area) => {
          const isExpanded = expandedArea === area.name;
          const greenCount = area.statusCounts['Green'] || 0;
          const amberCount = area.statusCounts['Amber'] || 0;
          const redCount = area.statusCounts['Red'] || 0;
          const grayCount = area.statusCounts['Gray'] || 0;

          const greenPct = area.projectsCount > 0 ? Math.round((greenCount / area.projectsCount) * 100) : 0;

          return (
            <div 
              key={area.name} 
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:border-slate-300"
              id={`area-card-${area.name.replace(/\s+/g, '-')}`}
            >
              {/* Header Panel */}
              <div 
                className="p-5 flex flex-col justify-between h-full gap-4 cursor-pointer hover:bg-slate-50/30"
                onClick={() => toggleExpand(area.name)}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold shrink-0">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{area.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{area.projectsCount} active items</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {greenCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-0.5 shrink-0" /> {greenCount}
                        </span>
                      )}
                      {amberCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-0.5 shrink-0" /> {amberCount}
                        </span>
                      )}
                      {redCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-100 flex items-center">
                          <XCircle className="w-3 h-3 mr-0.5 shrink-0" /> {redCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-base font-bold text-slate-800 block">{area.vps.size}</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">VPs In Scope</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-base font-bold text-slate-800 block">{area.leaders.size}</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Leads In Scope</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-base font-bold text-slate-800 block">{greenPct}%</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">On Track</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/70 text-xs font-semibold text-slate-500">
                  <span className="text-blue-600 hover:text-blue-700">
                    {isExpanded ? 'Hide area details' : 'View area projects'}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Collapsible Expanded Panel */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-2" id={`area-expanded-${area.name.replace(/\s+/g, '-')}`}>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Projects under {area.name} focus:
                  </span>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="area-project-scroll">
                    {area.projects.filter(p => !isTempProject(p.code) && !isCompleteOrLostStage(p.projectStage)).map((proj) => (
                      <div 
                        key={proj.code}
                        onClick={() => onProjectSelect(proj)}
                        className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer text-left"
                      >
                        <div className="space-y-0.5 truncate pr-2">
                          <div className="flex items-center space-x-1.5 truncate">
                            <span className="font-mono text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                              {proj.code}
                            </span>
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {proj.name}
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 block font-medium uppercase tracking-wide">
                            Leader: {proj.leader} (VP: {proj.vp})
                          </span>
                        </div>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase shrink-0 ${
                          proj.status === 'Green' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          proj.status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          proj.status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                          'bg-slate-50 text-slate-700 border-slate-100'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                    ))}
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
