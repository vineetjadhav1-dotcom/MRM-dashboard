import React, { useState } from 'react';
import { Project, Software2Project, LeaderData } from '@/src/types';
import { generateFullMRMReport, getDefaultMRMTitle } from '@/src/utils/mrmPdfCompiler';
import { 
  Printer, 
  X, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  Sparkles, 
  Sliders,
  Users,
  Building,
  UserCheck
} from 'lucide-react';
import { sortVpNames, sortLeaderNames } from '@/src/utils/customOrder';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  leaderDataList: LeaderData[];
  software2Projects?: Software2Project[];
  defaultTitle?: string;
  selectedVP?: string;
  selectedLeaderName?: string;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  projects,
  leaderDataList,
  software2Projects,
  defaultTitle,
  selectedVP = 'all',
  selectedLeaderName = 'all'
}: ExportReportModalProps) {
  const dynamicDefaultTitle = defaultTitle || getDefaultMRMTitle();
  const [reportTitle, setReportTitle] = useState<string>(dynamicDefaultTitle);
  const [scope, setScope] = useState<'full' | 'vp_only' | 'vp_full' | 'leader_only'>('full');
  const [targetVP, setTargetVP] = useState<string>(selectedVP !== 'all' ? selectedVP : 'KM');
  const [targetLeader, setTargetLeader] = useState<string>(
    selectedLeaderName !== 'all' ? selectedLeaderName : (leaderDataList[0]?.name || 'SP')
  );
  const [baselinePlan, setBaselinePlan] = useState<'r0' | 'r1' | 'both'>('r0');
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract distinct sorted VPs and Leaders
  const vpOptions = React.useMemo(() => {
    const vps = new Set<string>();
    leaderDataList.forEach((l) => {
      if (l.vpName) vps.add(l.vpName.trim());
    });
    projects.forEach((p) => {
      if (p.vp) vps.add(p.vp.trim());
    });
    return Array.from(vps).sort(sortVpNames);
  }, [leaderDataList, projects]);

  const leaderOptions = React.useMemo(() => {
    const leaders = leaderDataList.map((l) => l.name).filter(Boolean);
    return Array.from(new Set(leaders)).sort(sortLeaderNames);
  }, [leaderDataList]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsGenerating(true);
    setIsComplete(false);
    setErrorMessage(null);
    setProgressCurrent(0);
    setProgressTotal(0);
    setProgressMessage('Preparing presentation slides...');

    try {
      await generateFullMRMReport({
        title: reportTitle,
        scope,
        selectedVP: scope === 'leader_only' ? 'all' : targetVP,
        selectedLeaderName: scope === 'leader_only' ? targetLeader : 'all',
        baselinePlan,
        projects,
        leaderDataList,
        software2Projects,
        onProgress: (current, total, msg) => {
          setProgressCurrent(current);
          setProgressTotal(total);
          setProgressMessage(msg);
        }
      });
      setIsComplete(true);
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Report export failed:', err);
      setErrorMessage(err?.message || 'Failed to generate PDF. Please try again.');
      setIsGenerating(false);
    }
  };

  const progressPercent = progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-5 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Export Presentation PDF Report</h3>
              <p className="text-[11px] text-slate-500">Generate A4 Landscape executive slide deck</p>
            </div>
          </div>
          {!isGenerating && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form Controls (Disabled during generation) */}
        {!isGenerating ? (
          <div className="space-y-4">
            {/* Report Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Meeting / Slide Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g. MRM - July 26"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Scope Selection: 4 distinct choices */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Report Scope &amp; Target Hierarchy
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Full MRM Deck */}
                <button
                  type="button"
                  onClick={() => setScope('full')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    scope === 'full'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Full MRM Deck
                    </span>
                    <span className="px-1 py-0.2 bg-indigo-100 text-indigo-700 text-[8px] font-extrabold rounded">
                      Standard
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    VP Overview + 5 Curves + All Leaders &amp; Project Pages (~62 Slides)
                  </p>
                </button>

                {/* 2. VP Summary Only */}
                <button
                  type="button"
                  onClick={() => setScope('vp_only')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    scope === 'vp_only'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-600" />
                      VP Overview Only
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    VP Cover + Summary + 5 VP Progress Curves (7 Slides)
                  </p>
                </button>

                {/* 3. VP Full Portfolio */}
                <button
                  type="button"
                  onClick={() => setScope('vp_full')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    scope === 'vp_full'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-600" />
                      VP Portfolio Deck
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Selected VP + all Leaders assigned under that VP
                  </p>
                </button>

                {/* 4. Single Leader Wise */}
                <button
                  type="button"
                  onClick={() => setScope('leader_only')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    scope === 'leader_only'
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                      Leader-wise Report
                    </span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Selected Leader Cover + Summary + Curves + Project Pages
                  </p>
                </button>
              </div>
            </div>

            {/* Target VP Dropdown (when VP scope chosen) */}
            {(scope === 'vp_only' || scope === 'vp_full') && (
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Select Vice President (VP)
                </label>
                <select
                  value={targetVP}
                  onChange={(e) => setTargetVP(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {vpOptions.map((vp) => (
                    <option key={vp} value={vp}>
                      VP: {vp}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Target Leader Dropdown (when Leader scope chosen) */}
            {scope === 'leader_only' && (
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider">
                  Select Project Leader
                </label>
                <select
                  value={targetLeader}
                  onChange={(e) => setTargetLeader(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {leaderOptions.map((ldr) => (
                    <option key={ldr} value={ldr}>
                      Team Leader: {ldr}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Baseline Plan Option */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Baseline Plan in Progress Curves
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'r0', label: 'R0 Plan' },
                  { id: 'r1', label: 'R1 Plan' },
                  { id: 'both', label: 'Both (Compare)' }
                ].map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setBaselinePlan(plan.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      baselinePlan === plan.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {plan.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium leading-relaxed">
                {errorMessage}
              </div>
            )}
          </div>
        ) : (
          /* Live Progress Feedback */
          <div className="py-6 px-4 space-y-4 text-center">
            {isComplete ? (
              <div className="space-y-2 animate-in fade-in zoom-in-90 duration-200">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-black text-slate-900">PDF Generation Complete!</h4>
                <p className="text-xs text-slate-500">Your multi-page executive presentation report has been downloaded.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border border-indigo-200">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Rendering High-Resolution Slides ({progressCurrent}/{progressTotal})
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto truncate font-medium">
                    {progressMessage}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-black text-indigo-600 block">{progressPercent}%</span>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        {!isGenerating && (
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartExport}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Generate &amp; Download PDF</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
