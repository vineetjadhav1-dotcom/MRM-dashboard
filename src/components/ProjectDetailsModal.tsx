import { useEffect } from 'react';
import { Project } from '@/src/types';
import { 
  X, 
  User, 
  Users, 
  MapPin, 
  Layers, 
  Calendar, 
  Activity, 
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

// Helper to ensure unit is consistently in Days
const formatDays = (val: string | undefined | null): string => {
  if (!val) return 'N/A';
  const clean = val.trim();
  if (clean.toLowerCase().includes('day')) {
    return clean;
  }
  if (!isNaN(parseFloat(clean))) {
    return `${clean} Days`;
  }
  return clean;
};

interface ProjectDetailsModalProps {
  project: Project | null;
  onClose: () => void;
}

export default function ProjectDetailsModal({ project, onClose }: ProjectDetailsModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans" aria-labelledby="modal-title" role="dialog" aria-modal="true" id="project-details-modal">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay background */}
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 transition-opacity backdrop-blur-xs" 
          aria-hidden="true" 
        />

        {/* Trick to center modal in desktop */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-slate-100">
          
          {/* Header Colored Band based on RAG Status */}
          <div className={`h-3 w-full ${
            project.status === 'Green' ? 'bg-emerald-500' :
            project.status === 'Amber' ? 'bg-amber-400' :
            project.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
          }`} />

          <div className="p-6 sm:p-8">
            {/* Close button & Project Code */}
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {project.code}
              </span>
              <button
                id="close-modal-btn"
                onClick={onClose}
                className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-950 tracking-tight leading-tight" id="modal-title">
              {project.name}
            </h3>

            {/* Status & Area Row */}
            <div className="flex flex-wrap items-center gap-2 mt-3 mb-6">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                project.status === 'Green' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                project.status === 'Amber' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                project.status === 'Red' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                  project.status === 'Green' ? 'bg-emerald-500' :
                  project.status === 'Amber' ? 'bg-amber-500' :
                  project.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
                {project.status} Health Index
              </span>

              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-full flex items-center">
                <Layers className="w-3 h-3 mr-1 text-slate-400" />
                {project.area}
              </span>
            </div>

            {/* Delivery Progress Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1.5 text-blue-600" />
                  Target Execution Progress
                </span>
                <span className="text-xs font-extrabold text-blue-700 font-mono">
                  {project.progress || '0%'}
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: project.progress && project.progress.includes('%') ? project.progress : '0%' }}
                  className={`h-full ${
                    project.status === 'Green' ? 'bg-emerald-500' :
                    project.status === 'Amber' ? 'bg-amber-400' :
                    project.status === 'Red' ? 'bg-rose-500' : 'bg-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Reporting Hierarchy Visual Flow */}
            <div className="space-y-3 mb-6" id="hierarchy-flow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Executive Reporting Alignment
              </span>
              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* VP Sponsor */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
                    VP
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">Sponsor VP</span>
                    <span className="font-bold text-slate-800">{project.vp}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 hidden sm:block shrink-0" />

                {/* Leader Direct report */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 border border-violet-100 flex items-center justify-center font-bold">
                    LD
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">Project Lead</span>
                    <span className="font-bold text-slate-800">{project.leader}</span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 hidden sm:block shrink-0" />

                {/* Target Code */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-bold">
                    PR
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block">Project Entity</span>
                    <span className="font-bold text-slate-800">{project.code}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Operational Parameters Grid */}
            <div className="space-y-2 mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Extended Project Controls & Operational Parameters
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" id="extended-operational-grid">
                {/* Project Stage */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Project Stage</span>
                  <span className="font-bold text-slate-800 block mt-1">{project.projectStage || 'N/A'}</span>
                </div>

                {/* Area Sqft */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Area</span>
                  <span className="font-bold text-slate-800 block mt-1">
                    {project.areaSqft ? `${project.areaSqft} Sqft` : 'N/A'}
                  </span>
                </div>

                {/* SPI */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">SPI (Schedule Index)</span>
                  <span className={`font-bold block mt-1 ${
                    project.spi && parseFloat(project.spi) >= 1.0 ? 'text-emerald-600' :
                    project.spi && parseFloat(project.spi) >= 0.85 ? 'text-amber-500' :
                    project.spi ? 'text-rose-500' : 'text-slate-800'
                  }`}>
                    {project.spi || 'N/A'}
                  </span>
                </div>

                {/* Quality Rating */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Quality Rating</span>
                  <span className="font-bold text-emerald-600 block mt-1">{project.qualityRating && project.qualityRating !== '-' ? project.qualityRating : '-'}</span>
                </div>

                {/* Safety Rating */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Safety Rating</span>
                  <span className="font-bold text-rose-600 block mt-1">{project.safetyRating && project.safetyRating !== '-' ? project.safetyRating : '-'}</span>
                </div>

                {/* Avg QHSE Rating */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Avg QHSE Rating</span>
                  <span className="font-bold text-amber-600 block mt-1">
                    {(() => {
                      const val = project.avgQhseRating || project.qhseRating;
                      return (val && val !== '-' && val.toUpperCase() !== 'N/A') ? val : 'N/A';
                    })()}
                  </span>
                </div>

                {/* Schedule Variance */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Schedule Variance</span>
                  <span className="font-bold text-slate-800 block mt-1">{formatDays(project.scheduleVariance)}</span>
                </div>

                {/* Delay in Month */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Delay in Month</span>
                  <span className={`font-bold block mt-1 ${
                    project.delayInCurrentMonth && project.delayInCurrentMonth !== '0 Days' && project.delayInCurrentMonth !== 'None' && parseFloat(project.delayInCurrentMonth) > 0 ? 'text-rose-500' : 'text-slate-800'
                  }`}>
                    {formatDays(project.delayInCurrentMonth)}
                  </span>
                </div>

                {/* Baseline Finish */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Baseline Finish</span>
                  <span className="font-semibold text-slate-600 block mt-1">{project.baselineFinish || 'N/A'}</span>
                </div>

                {/* Baseline 1 Finish */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Baseline1 Finish</span>
                  <span className="font-semibold text-slate-600 block mt-1">{project.baseline1Finish || 'N/A'}</span>
                </div>

                {/* Proposed Finish */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Proposed Finish</span>
                  <span className="font-bold text-blue-600 block mt-1">{project.proposedFinish || 'N/A'}</span>
                </div>

                {/* PM/Site Incharge */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">PM / Site Incharge</span>
                  <span className="font-bold text-slate-800 block mt-1">{project.pmSiteIncharge || 'N/A'}</span>
                </div>

                {/* Total Budget */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Budget</span>
                  <span className="font-bold text-emerald-600 block mt-1">{project.totalBudget || 'N/A'}</span>
                </div>

                {/* Total Labours */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Labours</span>
                  <span className="font-bold text-slate-800 block mt-1">{project.totalLabours || 'N/A'}</span>
                </div>

                {/* Total Milestone */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 text-xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Milestone</span>
                  <span className="font-bold text-slate-800 block mt-1">{project.totalMilestone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators (Milestones, VOWD, Labour) */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-5 mb-6" id="kpi-performance-table">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Monthly Performance Metrics (Row 3 & Row 4)
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[9px] pb-2">
                      <th className="py-2 text-center">Category</th>
                      <th className="py-2 text-center">Plan</th>
                      <th className="py-2 text-center">Achievement</th>
                      <th className="py-2 text-center">% Achieved</th>
                      <th className="py-2 text-center">Forecast (Next Mo)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-medium">
                    {/* Milestones */}
                    <tr>
                      <td className="py-3 font-bold text-slate-800 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span>Milestones</span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.milestonePlan || 'N/A'}</td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.milestoneAch || 'N/A'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                          project.milestonePctAch && project.milestonePctAch !== 'N/A' && parseFloat(project.milestonePctAch) >= 90 ? 'bg-emerald-50 text-emerald-700' :
                          project.milestonePctAch && project.milestonePctAch !== 'N/A' && parseFloat(project.milestonePctAch) >= 75 ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {project.milestonePctAch || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{project.milestoneFr || 'N/A'}</td>
                    </tr>
                    {/* VOWD */}
                    <tr>
                      <td className="py-3 font-bold text-slate-800 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                          <span>VOWD</span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.vowdPlan || 'N/A'}</td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.vowdAch || 'N/A'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                          project.vowdPctAch && project.vowdPctAch !== 'N/A' && parseFloat(project.vowdPctAch) >= 90 ? 'bg-emerald-50 text-emerald-700' :
                          project.vowdPctAch && project.vowdPctAch !== 'N/A' && parseFloat(project.vowdPctAch) >= 75 ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {project.vowdPctAch || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{project.vowdFr || 'N/A'}</td>
                    </tr>
                    {/* Labour */}
                    <tr>
                      <td className="py-3 font-bold text-slate-800 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                          <span>Labour</span>
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.labourPlan || 'N/A'}</td>
                      <td className="py-3 text-center font-mono text-slate-900">{project.labourAch || 'N/A'}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                          project.labourPctAch && project.labourPctAch !== 'N/A' && parseFloat(project.labourPctAch) >= 90 ? 'bg-emerald-50 text-emerald-700' :
                          project.labourPctAch && project.labourPctAch !== 'N/A' && parseFloat(project.labourPctAch) >= 75 ? 'bg-amber-50 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {project.labourPctAch || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-500">{project.labourFr || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Update / Remarks */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Monthly Executive Review Comments
              </span>
              <div className="bg-slate-50 border-l-4 border-blue-600 rounded-r-2xl p-5 text-sm italic text-slate-700 leading-relaxed font-serif" id="modal-remarks-box">
                &ldquo;{project.update}&rdquo;
              </div>
            </div>

            {/* Raw Row details if available */}
            {project.rawRow && project.rawRow.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Complete Google Sheet Cell Array
                </span>
                <div className="max-h-[100px] overflow-y-auto bg-slate-900 text-slate-300 font-mono text-[10px] p-3 rounded-xl scrollbar-thin">
                  <table className="w-full text-left">
                    <tbody>
                      {project.rawRow.map((cell, index) => (
                        <tr key={index} className="border-b border-slate-800 last:border-0 py-1">
                          <td className="text-slate-500 pr-3 font-semibold w-16">Col {String.fromCharCode(65 + index)}:</td>
                          <td className="text-slate-200 select-all">{cell || '(empty)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
