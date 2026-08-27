import { useState, useRef, ChangeEvent } from 'react';
import { googleSignIn } from '@/src/lib/firebase';
import { Database, LayoutDashboard, ExternalLink, Sparkles, UploadCloud, FileSpreadsheet, KeyRound, AlertCircle, Globe, RefreshCw, CheckCircle2 } from 'lucide-react';
import { parseCsvText } from '@/src/utils/csvParser';
import { fetchPublicGoogleSheet, TARGET_SPREADSHEET_ID, TAB_SOFTWARE_1, TAB_SOFTWARE_2 } from '@/src/utils/googleSheetsApi';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
  onViewDemo: () => void;
  onLoadData?: (rows: string[][], rows2?: string[][]) => void;
}

export default function Login({ onLoginSuccess, onViewDemo, onLoadData }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'direct' | 'google' | 'csv'>('direct');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isConnectingDirect, setIsConnectingDirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const [s1FileName, setS1FileName] = useState<string | null>(null);
  const [s2FileName, setS2FileName] = useState<string | null>(null);
  const [s1Rows, setS1Rows] = useState<string[][] | null>(null);
  const [s2Rows, setS2Rows] = useState<string[][] | null>(null);

  const handleDirectSheetConnect = async () => {
    setIsConnectingDirect(true);
    setError(null);
    try {
      const [rows1, rows2] = await Promise.all([
        fetchPublicGoogleSheet(TARGET_SPREADSHEET_ID, TAB_SOFTWARE_1),
        fetchPublicGoogleSheet(TARGET_SPREADSHEET_ID, TAB_SOFTWARE_2).catch(() => null)
      ]);
      if (rows1 && rows1.length > 0 && onLoadData) {
        onLoadData(rows1, rows2 || undefined);
      }
    } catch (err: any) {
      console.warn(err);
      setError(
        'Direct connection returned 401/403. Please ensure the Google Sheet Share setting is set to "Anyone with the link (Viewer)", or use the CSV / Google Sign-in options below.'
      );
    } finally {
      setIsConnectingDirect(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result?.accessToken) {
        onLoginSuccess(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || 'Authentication failed. Please check your network and try again.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>, isSoftware2: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCsvText(text);
        if (parsed.length === 0) {
          setCsvError(`The selected file "${file.name}" appears to be empty.`);
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
        setCsvError(`Failed to parse CSV: ${err.message || err}`);
      }
    };
    reader.onerror = () => {
      setCsvError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleLaunchWithCsv = () => {
    if (!s1Rows || s1Rows.length === 0) {
      setCsvError('Please upload at least the primary "Software1" sheet CSV file.');
      return;
    }
    if (onLoadData) {
      onLoadData(s1Rows, s2Rows || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="login-container">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white" id="brand-logo-container">
            <LayoutDashboard className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Monthly Review Meeting
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Corporate Executive Performance &amp; Project Dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-100 sm:rounded-2xl sm:px-10 border border-slate-100" id="login-card">
          
          {/* Target Sheet Info */}
          <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-100 text-sm text-slate-700 space-y-2" id="sheet-details-box">
            <div className="flex items-start space-x-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs">Connected Google Sheet:</span>
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=1693110860`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center font-medium"
                  >
                    Open Sheet <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 break-all select-all font-mono mt-0.5">
                  {TARGET_SPREADSHEET_ID}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-blue-600" /> Tab 1: {TAB_SOFTWARE_1}
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-indigo-600" /> Tab 2: {TAB_SOFTWARE_2}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Method Tabs */}
          <div className="flex border-b border-slate-200 mb-6 text-xs" id="login-tabs">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 pb-3 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'direct'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 pb-3 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'csv'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`flex-1 pb-3 font-bold border-b-2 transition-colors flex items-center justify-center space-x-1.5 ${
                activeTab === 'google'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Google Login</span>
            </button>
          </div>

          {/* Tab 1: Direct Link Connection */}
          {activeTab === 'direct' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold flex items-center text-emerald-800">
                  <Globe className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Connect directly with 1-Click:
                </p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Click the button below to sync <strong>Software1</strong> and <strong>Software2</strong>.
                </p>
                <div className="pt-1.5 border-t border-emerald-200/60 text-[10px] text-emerald-700">
                  <em>Note: Ensure your spreadsheet sharing is set to: <strong>Share &gt; Anyone with the link (Viewer)</strong></em>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-bold">Sheet Access Note:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed mt-1">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleDirectSheetConnect}
                  disabled={isConnectingDirect}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${isConnectingDirect ? 'animate-spin' : ''}`} />
                  <span>{isConnectingDirect ? 'Connecting to Spreadsheet...' : 'Connect & Open Dashboard'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: CSV Import */}
          {activeTab === 'csv' && (
            <div className="space-y-5" id="csv-upload-section">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-bold flex items-center">
                  <FileSpreadsheet className="w-4 h-4 mr-1.5 text-blue-600" />
                  How to export from Google Sheets:
                </p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Export <strong>Software1</strong> &amp; <strong>Software2</strong> as CSV files (File &gt; Download &gt; Comma Separated Values .csv) and upload both below.
                </p>
              </div>

              <div className="space-y-3">
                {/* Software 1 Upload */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">1. Software 1 (Master Sheet)</span>
                    {s1FileName && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {s1Rows?.length} rows
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef1}
                    accept=".csv,.txt"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef1.current?.click()}
                    className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{s1FileName ? s1FileName : 'Select Software 1 CSV File'}</span>
                  </button>
                </div>

                {/* Software 2 Upload */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">2. Software 2 (Timeline &amp; Progress)</span>
                    {s2FileName && (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {s2Rows?.length} rows
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef2}
                    accept=".csv,.txt"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef2.current?.click()}
                    className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 bg-white rounded-lg text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>{s2FileName ? s2FileName : 'Select Software 2 CSV File (Optional)'}</span>
                  </button>
                </div>
              </div>

              {csvError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>{csvError}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  id="launch-csv-btn"
                  onClick={handleLaunchWithCsv}
                  disabled={!s1Rows}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Load Spreadsheet Data
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Google Login */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              {error && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 space-y-2" id="login-error-alert">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <p className="font-semibold text-rose-800">Firebase: Error (auth/unauthorized-domain)</p>
                  </div>
                  
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Firebase blocks authentication requests on <code className="bg-rose-100/70 text-rose-800 px-1 py-0.5 rounded font-mono">localhost</code> until it is added to your project's authorized list.
                  </p>
                </div>
              )}

              <div className="space-y-4" id="login-actions">
                <button
                  id="gsi-login-btn"
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full flex justify-center items-center px-4 py-3.5 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="h-5 w-5 mr-3 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.56h3.29c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.67,11.96 21.56,11.5 21.35,11.1z" fill="#4285f4" />
                    <path d="M12,20.84c2.5,0 4.6,-0.83 6.13,-2.25l-3.29,-2.56c-0.91,0.61 -2.08,0.97 -3.29,0.97 -2.4,0 -4.43,-1.63 -5.16,-3.82H2.98v2.64C4.52,18.91 8.01,20.84 12,20.84z" fill="#34a853" />
                    <path d="M6.84,13.18c-0.18,-0.55 -0.29,-1.13 -0.29,-1.74s0.1,-1.19 0.29,-1.74V7.06H2.98c-0.63,1.27 -0.98,2.71 -0.98,4.24s0.35,2.97 0.98,4.24L6.84,13.18z" fill="#fbbc05" />
                    <path d="M12,6.15c1.36,0 2.58,0.47 3.54,1.38l2.65,-2.65C16.6,3.39 14.5,2.56 12,2.56c-4,0 -7.49,1.93 -9.02,5.2l3.86,2.64c0.73,-2.19 2.76,-3.82 5.16,-3.82z" fill="#ea4335" />
                  </svg>
                  {isLoggingIn ? 'Connecting to Google Accounts...' : 'Sign in with Google'}
                </button>
              </div>
            </div>
          )}

        </div>
        
        <p className="mt-4 text-center text-xs text-slate-400 flex justify-center items-center space-x-1">
          <span>Enterprise Secure Connection</span>
          <span>•</span>
          <a 
            href={`https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=1693110860`}
            target="_blank" 
            rel="noreferrer noopener"
            className="text-slate-500 hover:text-slate-600 underline flex items-center"
          >
            <span>Target Spreadsheet</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </p>
      </div>
    </div>
  );
}
