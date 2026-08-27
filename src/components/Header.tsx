import { useState, useRef, ChangeEvent } from 'react';
import { User } from 'firebase/auth';
import PlanedgeLogo from './PlanedgeLogo';
import { generatePdfReport } from '@/src/utils/pdfExport';
import { parseCsvText, parsePastedSheetText } from '@/src/utils/csvParser';
import { Project, Software2Project, LeaderData } from '@/src/types';
import { groupProjectsByLeader } from '@/src/utils/sheetParser';
import ExportReportModal from './report/ExportReportModal';
import { getDefaultMRMTitle } from '@/src/utils/mrmPdfCompiler';
import { 
  RefreshCw, 
  LogOut, 
  ExternalLink, 
  Database, 
  Sparkles, 
  UserCheck, 
  Printer, 
  Loader2, 
  Pencil, 
  UploadCloud, 
  FileSpreadsheet, 
  X, 
  ClipboardPaste, 
  CheckCircle2, 
  Globe 
} from 'lucide-react';
import { fetchPublicGoogleSheet, TARGET_SPREADSHEET_ID, TAB_SOFTWARE_1, TAB_SOFTWARE_2 } from '@/src/utils/googleSheetsApi';

interface HeaderProps {
  user: User | null;
  isUsingDemo: boolean;
  isLoading: boolean;
  onLogout: () => void;
  onRefresh: () => void;
  onToggleDemo: (useDemo: boolean) => void;
  projectsCount: number;
  projects?: Project[];
  software2Projects?: Software2Project[];
  onLoadCustomData?: (rows: string[][], rows2?: string[][]) => void;
  onOpenLogin?: () => void;
}

export default function Header({
  user,
  isUsingDemo,
  isLoading,
  onLogout,
  onRefresh,
  onToggleDemo,
  projectsCount,
  projects = [],
  software2Projects = [],
  onLoadCustomData,
  onOpenLogin
}: HeaderProps) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [mrmTitle, setMrmTitle] = useState(() => {
    return localStorage.getItem('planedge_mrm_title') || 'Planedge Dashboard';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncTab, setSyncTab] = useState<'paste' | 'csv' | 'direct'>('paste');

  // Paste Tab States
  const [pastedS1Text, setPastedS1Text] = useState('');
  const [pastedS2Text, setPastedS2Text] = useState('');
  const [isConnectingDirect, setIsConnectingDirect] = useState(false);

  // CSV Tab States
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const [s1FileName, setS1FileName] = useState<string | null>(null);
  const [s2FileName, setS2FileName] = useState<string | null>(null);
  const [s1Rows, setS1Rows] = useState<string[][] | null>(null);
  const [s2Rows, setS2Rows] = useState<string[][] | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleTitleChange = (val: string) => {
    setMrmTitle(val);
    localStorage.setItem('planedge_mrm_title', val);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, isSoftware2: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSyncError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvText(text);
        if (parsed.length === 0) {
          setSyncError(`The selected file "${file.name}" appears to be empty.`);
          return;
        }
        if (isSoftware2) {
          setS2FileName(file.name);
          setS2Rows(parsed);
        } else {
          setS1FileName(file.name);
          setS1Rows(parsed);
        }
      } catch (err: any) {
        setSyncError(`Failed to parse CSV: ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      setSyncError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleApplyPaste = () => {
    setSyncError(null);
    if (!pastedS1Text.trim()) {
      setSyncError('Please paste the data from tab "Software1" into the box above.');
      return;
    }
    const rows1 = parsePastedSheetText(pastedS1Text);
    if (rows1.length === 0) {
      setSyncError('Could not detect any rows from the pasted text. Please make sure you copied cells from Google Sheets.');
      return;
    }
    const rows2 = pastedS2Text.trim() ? parsePastedSheetText(pastedS2Text) : undefined;
    if (onLoadCustomData) {
      onLoadCustomData(rows1, rows2);
    }
    setShowSyncModal(false);
  };

  const handleApplyCsv = () => {
    setSyncError(null);
    if (!s1Rows || s1Rows.length === 0) {
      setSyncError('Please select at least the primary "Software1" CSV file.');
      return;
    }
    if (onLoadCustomData) {
      onLoadCustomData(s1Rows, s2Rows || undefined);
    }
    setShowSyncModal(false);
  };

  const handleDirectFetch = async () => {
    setIsConnectingDirect(true);
    setSyncError(null);
    try {
      const [rows1, rows2] = await Promise.all([
        fetchPublicGoogleSheet(TARGET_SPREADSHEET_ID, TAB_SOFTWARE_1),
        fetchPublicGoogleSheet(TARGET_SPREADSHEET_ID, TAB_SOFTWARE_2).catch(() => null)
      ]);
      if (rows1 && rows1.length > 0 && onLoadCustomData) {
        onLoadCustomData(rows1, rows2 || undefined);
        setShowSyncModal(false);
      }
    } catch (err: any) {
      setSyncError(
        'Direct connection blocked by organization sharing permissions. Please use the "Paste from Sheet" tab to sync in 5 seconds!'
      );
    } finally {
      setIsConnectingDirect(false);
    }
  };

  const handleExportPdf = () => {
    setShowExportModal(true);
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3 font-sans" id="app-header">
      <div className="max-w-[1536px] mx-auto flex flex-col gap-2.5">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          
          {/* Top Left: Logo + Title */}
          <div className="flex items-center space-x-3.5" id="header-title-container">
            <PlanedgeLogo size="md" />

            <div>
              <div className="flex items-center space-x-2">
                {isEditingTitle ? (
                  <input
                    type="text"
                    value={mrmTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="text-xl sm:text-2xl font-bold text-slate-900 bg-slate-50 border-b-2 border-indigo-600 focus:outline-none px-1 rounded-sm"
                  />
                ) : (
                  <div 
                    className="flex items-center gap-2 group cursor-pointer" 
                    onClick={() => setIsEditingTitle(true)}
                    title="Click to edit title"
                  >
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {mrmTitle || 'Planedge Dashboard'}
                    </h1>
                    <Pencil className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                )}

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Database className="w-3 h-3 mr-1 text-emerald-600" />
                  Live Data ({projectsCount} Projects)
                </span>
              </div>
              
              <p className="text-xs text-slate-500 font-semibold flex items-center mt-0.5">
                <span>{formattedDate}</span>
              </p>
            </div>
          </div>

          {/* Extreme Right Top Corner: Action Buttons */}
          <div className="flex items-center space-x-2.5" id="header-top-right-corner">
            {/* Sync Spreadsheet Data */}
            <button
              onClick={() => setShowSyncModal(true)}
              className="inline-flex items-center px-3.5 py-1.5 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
              title="Sync Live Spreadsheet Data"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Sync Spreadsheet Data
            </button>

            {/* Source Sheet Link */}
            <a
              href="https://docs.google.com/spreadsheets/d/1BDEpLJk9tIo9Y-CxJYksR2GRjaCuQalr1p2ZNTI5AJA/edit?gid=0#gid=0"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
              id="view-sheet-header-link"
            >
              <span>View Source Sheet</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
            </a>

            {user ? (
              <div className="flex items-center space-x-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-2xs" id="user-profile-widget">
                <div className="flex items-center space-x-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#8b6559] text-white flex items-center justify-center text-sm font-bold uppercase shadow-2xs shrink-0">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-800 tracking-tight truncate max-w-[150px]">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                      {user.email || ''}
                    </p>
                  </div>
                </div>
                
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

        </div>

      </div>

      {/* Sync Spreadsheet Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Synchronize Spreadsheet Data</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs">
              <button
                onClick={() => setSyncTab('paste')}
                className={`flex-1 pb-2.5 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  syncTab === 'paste'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Paste from Sheet (Fastest)</span>
              </button>
              <button
                onClick={() => setSyncTab('csv')}
                className={`flex-1 pb-2.5 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  syncTab === 'csv'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
              </button>
              <button
                onClick={() => setSyncTab('direct')}
                className={`flex-1 pb-2.5 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                  syncTab === 'direct'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Direct Link</span>
              </button>
            </div>

            {syncError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {syncError}
              </div>
            )}

            {/* TAB 1: PASTE DIRECTLY FROM GOOGLE SHEETS */}
            {syncTab === 'paste' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1.5">
                  <p className="font-bold flex items-center text-blue-800">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-blue-600" />
                    How to copy &amp; paste in 5 seconds:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-blue-800 space-y-1 leading-relaxed">
                    <li>Open your <a href="https://docs.google.com/spreadsheets/d/1BDEpLJk9tIo9Y-CxJYksR2GRjaCuQalr1p2ZNTI5AJA/edit?gid=0#gid=0" target="_blank" rel="noreferrer" className="underline font-semibold">Google Sheet</a>.</li>
                    <li>On tab <strong>Software1</strong>, press <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded font-mono font-bold">Ctrl + A</kbd> (select all) &rarr; <kbd className="px-1.5 py-0.5 bg-white border border-blue-200 rounded font-mono font-bold">Ctrl + C</kbd> (copy).</li>
                    <li>Paste into the box below and click <strong>&quot;Apply &amp; Refresh&quot;</strong>!</li>
                  </ol>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Paste Software1 Sheet Data <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={pastedS1Text}
                    onChange={(e) => setPastedS1Text(e.target.value)}
                    placeholder="Click here and press Ctrl + V to paste copied cells from Software1..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none"
                  />
                  {pastedS1Text.trim() && (
                    <p className="text-[10px] text-emerald-600 font-semibold">
                      ✓ Detected {pastedS1Text.split('\n').filter(l => l.trim()).length} rows ready to parse.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Paste Software2 Sheet Data <span className="text-slate-400 font-normal">(Optional for Plan vs Ach)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={pastedS2Text}
                    onChange={(e) => setPastedS2Text(e.target.value)}
                    placeholder="Optional: Copy and paste Software2 sheet cells here..."
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyPaste}
                    disabled={!pastedS1Text.trim()}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Apply &amp; Refresh
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD CSV FILES */}
            {syncTab === 'csv' && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                  <p className="font-bold">How to download CSV from Google Sheets:</p>
                  <p className="text-[11px] leading-relaxed">
                    Open your Google Sheet &rarr; Tab <strong>Software1</strong> &rarr; Click <strong>File &gt; Download &gt; Comma Separated Values (.csv)</strong>.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Software1 Sheet CSV <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef1}
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef1.current?.click()}
                      className={`w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-between text-xs cursor-pointer ${
                        s1FileName
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="truncate font-medium">
                        {s1FileName ? `✓ ${s1FileName} (${s1Rows?.length || 0} rows)` : 'Select Software1.csv'}
                      </span>
                      <span className="font-bold text-blue-600 ml-2 shrink-0">Browse</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Software2 Sheet CSV <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef2}
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef2.current?.click()}
                      className={`w-full p-3 border-2 border-dashed rounded-xl flex items-center justify-between text-xs cursor-pointer ${
                        s2FileName
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className="truncate font-medium">
                        {s2FileName ? `✓ ${s2FileName} (${s2Rows?.length || 0} rows)` : 'Select Software2.csv'}
                      </span>
                      <span className="font-bold text-blue-600 ml-2 shrink-0">Browse</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="flex-1 py-2.5 px-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCsv}
                    disabled={!s1Rows}
                    className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Apply &amp; Refresh
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DIRECT LINK */}
            {syncTab === 'direct' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <p className="font-bold text-slate-800">Target Google Spreadsheet:</p>
                  <p className="text-[11px] font-mono text-slate-500 break-all">{TARGET_SPREADSHEET_ID}</p>
                  <p className="text-[10px] text-slate-500 pt-1">
                    <em>Requires spreadsheet to be published to web (File &gt; Share &gt; Publish to web)</em>
                  </p>
                </div>

                <button
                  onClick={handleDirectFetch}
                  disabled={isConnectingDirect}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isConnectingDirect ? 'animate-spin' : ''}`} />
                  <span>{isConnectingDirect ? 'Connecting...' : 'Fetch Directly from Link'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Multi-page Presentation PDF Export Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projects={projects}
        leaderDataList={groupProjectsByLeader(projects)}
        software2Projects={software2Projects}
        defaultTitle={getDefaultMRMTitle()}
        selectedVP="all"
        selectedLeaderName="all"
      />
    </header>
  );
}
