import { useState, useMemo } from 'react';
import { 
  ColumnMapping, 
  Software2Mapping 
} from '@/src/types';
import { detectColumnMapping } from '@/src/utils/sheetParser';
import { 
  SlidersHorizontal, 
  FileSpreadsheet, 
  Layers, 
  Search, 
  CheckCircle2, 
  ChevronDown, 
  Info,
  Check,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

interface ColumnMapperProps {
  sheetRows: string[][];
  headerRowIndex: number;
  mapping: ColumnMapping;
  onUpdateMapping: (newMapping: ColumnMapping, newHeaderIdx: number) => void;
  software2SheetRows?: string[][];
  software2HeaderRowIndex?: number;
  software2Mapping?: Software2Mapping;
  onUpdateSoftware2Mapping?: (newMapping: Software2Mapping, newHeaderIdx: number) => void;
  isUsingDemo?: boolean;
}

function getColLetter(index: number): string {
  let temp = index;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

type S2TabType = 'meta' | 'vowd' | 'milestone' | 'labour' | 'ur' | 'uc';

interface S2ParamDef {
  key: string;
  category: S2TabType;
  primaryLabel: string;
  subLabel: string;
  defaultColIndex: number;
  mappingProp?: keyof Software2Mapping;
  overrideKey?: string;
}

export default function ColumnMapper({
  sheetRows = [],
  headerRowIndex = 3,
  mapping,
  onUpdateMapping,
  software2SheetRows = [],
  software2HeaderRowIndex = 3,
  software2Mapping = {
    codeIndex: 1,
    nameIndex: 2,
    leaderIndex: 3,
    vpIndex: 4,
    stageIndex: 5,
    areaIndex: -1,
    spiIndex: 6,
    qualityRatingIndex: 8,
    safetyRatingIndex: 9,
    avgQhseRatingIndex: 10,
    metricOverrides: {}
  },
  onUpdateSoftware2Mapping
}: ColumnMapperProps) {
  const [activeSheetTab, setActiveSheetTab] = useState<'software1' | 'software2'>('software2');
  const [activeS2Tab, setActiveS2Tab] = useState<S2TabType>('vowd');
  const [s2FilterQuery, setS2FilterQuery] = useState('');

  // Software 1 Header & Parent rows
  const s1HeaderRow = sheetRows[headerRowIndex] || [];
  const s1ParentRow = headerRowIndex > 0 ? sheetRows[headerRowIndex - 1] : undefined;

  // Software 2 Header & Parent & Sample rows
  const s2HeaderRow = software2SheetRows[software2HeaderRowIndex] || [];
  const s2ParentRow = software2HeaderRowIndex > 0 ? software2SheetRows[software2HeaderRowIndex - 1] : undefined;
  
  const s2SampleRow = useMemo(() => {
    for (let r = software2HeaderRowIndex + 1; r < software2SheetRows.length; r++) {
      if (software2SheetRows[r] && software2SheetRows[r].some(cell => String(cell || '').trim().length > 0)) {
        return software2SheetRows[r];
      }
    }
    return [];
  }, [software2SheetRows, software2HeaderRowIndex]);

  // Software 1 Change Handlers
  const handleS1ColumnChange = (field: keyof ColumnMapping, value: number) => {
    const updated = { ...mapping, [field]: value };
    onUpdateMapping(updated, headerRowIndex);
  };

  const handleS1HeaderRowChange = (index: number) => {
    if (index < 0 || index >= sheetRows.length) return;
    const nextRow = sheetRows[index] || [];
    const pRow = index > 0 ? sheetRows[index - 1] : undefined;
    const nextMapping = detectColumnMapping(nextRow, pRow);
    onUpdateMapping(nextMapping, index);
  };

  // Software 2 Change Handlers
  const handleS2HeaderRowChange = (index: number) => {
    if (!onUpdateSoftware2Mapping || !software2Mapping) return;
    if (index < 0 || index >= software2SheetRows.length) return;
    onUpdateSoftware2Mapping(software2Mapping, index);
  };

  // 12 Fiscal Months for Software 2
  const MONTHS_CONFIG = [
    { key: 'Apr-26', shortName: 'Apr', label: 'April 2026', hasR1: false },
    { key: 'May-26', shortName: 'May', label: 'May 2026', hasR1: false },
    { key: 'Jun-26', shortName: 'Jun', label: 'June 2026', hasR1: false },
    { key: 'Jul-26', shortName: 'Jul', label: 'July 2026', hasR1: false },
    { key: 'Aug-26', shortName: 'Aug', label: 'August 2026', hasR1: false },
    { key: 'Sep-26', shortName: 'Sep', label: 'September 2026', hasR1: false },
    { key: 'Oct-26', shortName: 'Oct', label: 'October 2026', hasR1: true },
    { key: 'Nov-26', shortName: 'Nov', label: 'November 2026', hasR1: true },
    { key: 'Dec-26', shortName: 'Dec', label: 'December 2026', hasR1: true },
    { key: 'Jan-27', shortName: 'Jan', label: 'January 2027', hasR1: true },
    { key: 'Feb-27', shortName: 'Feb', label: 'February 2027', hasR1: true },
    { key: 'Mar-27', shortName: 'Mar', label: 'March 2027', hasR1: true },
  ];

  // Default coordinate offsets for Software 2
  const S2_DEFAULT_OFFSETS: Record<string, { r0: number; r1?: number; ach: number }> = {
    'vowd_Apr-26': { r0: 18, ach: 19 },
    'vowd_May-26': { r0: 20, ach: 21 },
    'vowd_Jun-26': { r0: 22, ach: 23 },
    'vowd_Jul-26': { r0: 24, ach: 25 },
    'vowd_Aug-26': { r0: 26, ach: 27 },
    'vowd_Sep-26': { r0: 28, ach: 29 },
    'vowd_Oct-26': { r0: 30, r1: 31, ach: 32 },
    'vowd_Nov-26': { r0: 33, r1: 34, ach: 35 },
    'vowd_Dec-26': { r0: 36, r1: 37, ach: 38 },
    'vowd_Jan-27': { r0: 39, r1: 40, ach: 41 },
    'vowd_Feb-27': { r0: 42, r1: 43, ach: 44 },
    'vowd_Mar-27': { r0: 45, r1: 46, ach: 47 },

    'milestone_Apr-26': { r0: 57, ach: 58 },
    'milestone_May-26': { r0: 59, ach: 60 },
    'milestone_Jun-26': { r0: 61, ach: 62 },
    'milestone_Jul-26': { r0: 63, ach: 64 },
    'milestone_Aug-26': { r0: 65, ach: 66 },
    'milestone_Sep-26': { r0: 67, ach: 68 },
    'milestone_Oct-26': { r0: 69, r1: 70, ach: 71 },
    'milestone_Nov-26': { r0: 72, r1: 73, ach: 74 },
    'milestone_Dec-26': { r0: 75, r1: 76, ach: 77 },
    'milestone_Jan-27': { r0: 78, r1: 79, ach: 80 },
    'milestone_Feb-27': { r0: 81, r1: 82, ach: 83 },
    'milestone_Mar-27': { r0: 84, r1: 85, ach: 86 },

    'ur_Apr-26': { r0: 95, ach: 96 },
    'ur_May-26': { r0: 97, ach: 98 },
    'ur_Jun-26': { r0: 99, ach: 100 },
    'ur_Jul-26': { r0: 101, ach: 102 },
    'ur_Aug-26': { r0: 103, ach: 104 },
    'ur_Sep-26': { r0: 105, ach: 106 },
    'ur_Oct-26': { r0: 107, r1: 108, ach: 109 },
    'ur_Nov-26': { r0: 110, r1: 111, ach: 112 },
    'ur_Dec-26': { r0: 113, r1: 114, ach: 115 },
    'ur_Jan-27': { r0: 116, r1: 117, ach: 118 },
    'ur_Feb-27': { r0: 119, r1: 120, ach: 121 },
    'ur_Mar-27': { r0: 122, r1: 123, ach: 124 },

    'uc_Apr-26': { r0: 132, ach: 133 },
    'uc_May-26': { r0: 134, ach: 135 },
    'uc_Jun-26': { r0: 136, ach: 137 },
    'uc_Jul-26': { r0: 138, ach: 139 },
    'uc_Aug-26': { r0: 140, ach: 141 },
    'uc_Sep-26': { r0: 142, ach: 143 },
    'uc_Oct-26': { r0: 144, r1: 145, ach: 146 },
    'uc_Nov-26': { r0: 147, r1: 148, ach: 149 },
    'uc_Dec-26': { r0: 150, r1: 151, ach: 152 },
    'uc_Jan-27': { r0: 153, r1: 154, ach: 155 },
    'uc_Feb-27': { r0: 156, r1: 157, ach: 158 },
    'uc_Mar-27': { r0: 159, r1: 160, ach: 161 },

    'labour_Apr-26': { r0: 228, ach: 229 },
    'labour_May-26': { r0: 230, ach: 231 },
    'labour_Jun-26': { r0: 232, ach: 233 },
    'labour_Jul-26': { r0: 234, ach: 235 },
    'labour_Aug-26': { r0: 236, ach: 237 },
    'labour_Sep-26': { r0: 238, ach: 239 },
    'labour_Oct-26': { r0: 241, r1: 242, ach: 243 },
    'labour_Nov-26': { r0: 244, r1: 245, ach: 246 },
    'labour_Dec-26': { r0: 247, r1: 248, ach: 249 },
    'labour_Jan-27': { r0: 250, r1: 251, ach: 252 },
    'labour_Feb-27': { r0: 253, r1: 254, ach: 255 },
    'labour_Mar-27': { r0: 256, r1: 257, ach: 258 }
  };

  // Build Software 2 parameter list
  const s2Parameters: S2ParamDef[] = useMemo(() => {
    const list: S2ParamDef[] = [];

    // General Metadata
    list.push(
      { key: 'meta_code', category: 'meta', primaryLabel: 'Project ID', subLabel: 'Unique Project Identifier (Col B)', defaultColIndex: 1, mappingProp: 'codeIndex' },
      { key: 'meta_name', category: 'meta', primaryLabel: 'Project', subLabel: 'Official Project Name (Col C)', defaultColIndex: 2, mappingProp: 'nameIndex' },
      { key: 'meta_leader', category: 'meta', primaryLabel: 'Leader', subLabel: 'Lead Project Manager (Col D)', defaultColIndex: 3, mappingProp: 'leaderIndex' },
      { key: 'meta_vp', category: 'meta', primaryLabel: 'VP', subLabel: 'Executive Vice President (Col E)', defaultColIndex: 4, mappingProp: 'vpIndex' },
      { key: 'meta_stage', category: 'meta', primaryLabel: 'Project Stage', subLabel: 'Current Lifecycle Stage (Col F)', defaultColIndex: 5, mappingProp: 'stageIndex' }
    );

    // Helper for 12 months with verbatim user-requested titles
    const addMonths = (metricCategory: S2TabType, prefix: string, displayPrefix: string) => {
      MONTHS_CONFIG.forEach(m => {
        const offset = S2_DEFAULT_OFFSETS[`${prefix}_${m.key}`];
        if (!offset) return;

        // R0 Plan
        list.push({
          key: `${prefix}_${m.key}_r0`,
          category: metricCategory,
          primaryLabel: `"${displayPrefix} ${m.shortName} R0 Plan"`,
          subLabel: `Initial Baseline Target (${m.label})`,
          defaultColIndex: offset.r0,
          overrideKey: `${prefix}_${m.key}_planR0`
        });

        // R1 Plan (Oct-Mar)
        if (m.hasR1 && offset.r1 !== undefined) {
          list.push({
            key: `${prefix}_${m.key}_r1`,
            category: metricCategory,
            primaryLabel: `"${displayPrefix} ${m.shortName} R1 Plan"`,
            subLabel: `Revised H2 Plan (${m.label})`,
            defaultColIndex: offset.r1,
            overrideKey: `${prefix}_${m.key}_planR1`
          });
        }

        // Actual Achievement
        list.push({
          key: `${prefix}_${m.key}_ach`,
          category: metricCategory,
          primaryLabel: `"${displayPrefix} ${m.shortName} Ach"`,
          subLabel: `Actual Achievement (${m.label})`,
          defaultColIndex: offset.ach,
          overrideKey: `${prefix}_${m.key}_achievement`
        });
      });
    };

    addMonths('vowd', 'vowd', 'VOWD');
    addMonths('milestone', 'milestone', 'Milestone');
    addMonths('labour', 'labour', 'Labour');
    addMonths('ur', 'ur', 'UR');
    addMonths('uc', 'uc', 'UC');

    return list;
  }, []);

  // Filter Software 2 parameters
  const visibleS2Rows = useMemo(() => {
    return s2Parameters.filter(p => {
      if (p.category !== activeS2Tab) return false;
      if (s2FilterQuery.trim()) {
        const q = s2FilterQuery.toLowerCase().trim();
        const matches = 
          p.primaryLabel.toLowerCase().includes(q) ||
          p.subLabel.toLowerCase().includes(q) ||
          p.key.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [s2Parameters, activeS2Tab, s2FilterQuery]);

  // Software 2 Selected Column Index
  const getS2SelectedColIndex = (param: S2ParamDef): number => {
    if (param.mappingProp && software2Mapping[param.mappingProp] !== undefined) {
      const val = software2Mapping[param.mappingProp];
      if (typeof val === 'number' && val >= 0) return val;
    }
    if (param.overrideKey && software2Mapping.metricOverrides && software2Mapping.metricOverrides[param.overrideKey] !== undefined) {
      const val = software2Mapping.metricOverrides[param.overrideKey];
      if (val >= 0) return val;
    }
    return param.defaultColIndex;
  };

  const isS2AutoDetected = (param: S2ParamDef): boolean => {
    const currentVal = getS2SelectedColIndex(param);
    return currentVal === param.defaultColIndex;
  };

  const handleS2ColChange = (param: S2ParamDef, newIndex: number) => {
    if (!onUpdateSoftware2Mapping) return;

    const newMapping: Software2Mapping = {
      ...software2Mapping,
      metricOverrides: { ...(software2Mapping.metricOverrides || {}) }
    };

    if (param.mappingProp) {
      (newMapping as any)[param.mappingProp] = newIndex;
    } else if (param.overrideKey) {
      if (!newMapping.metricOverrides) newMapping.metricOverrides = {};
      newMapping.metricOverrides[param.overrideKey] = newIndex;
    }

    onUpdateSoftware2Mapping(newMapping, software2HeaderRowIndex);
  };

  // Build Software 2 options
  const s2TotalOptions = useMemo(() => {
    const maxCols = Math.max(s2HeaderRow.length, 260);
    const opts: Array<{ idx: number; label: string; preview: string }> = [];
    
    for (let i = 0; i < maxCols; i++) {
      const letter = getColLetter(i);
      const hText = String(s2HeaderRow[i] || '').trim();
      const pText = String(s2ParentRow && s2ParentRow[i] ? s2ParentRow[i] : '').trim();
      const sVal = String(s2SampleRow[i] || '').trim();

      let displayLabel = `Col ${letter} (${i}): `;
      if (hText) {
        displayLabel += hText;
      } else if (pText) {
        displayLabel += `${pText} (Col ${letter})`;
      } else {
        displayLabel += `Column ${i + 1}`;
      }

      let cellPreview = hText || pText || (sVal ? `Sample: ${sVal}` : `Col ${letter}`);

      opts.push({
        idx: i,
        label: displayLabel,
        preview: cellPreview
      });
    }

    return opts;
  }, [s2HeaderRow, s2ParentRow, s2SampleRow]);

  // Software 1 Field Groups
  const s1FieldGroups = [
    {
      groupTitle: '1. Project Identification & Scope',
      icon: Building2,
      fields: [
        { label: 'Project ID / Code', field: 'codeIndex' as keyof ColumnMapping, desc: 'Unique project alphanumeric identifier (e.g. PL1284)' },
        { label: 'Project Name', field: 'nameIndex' as keyof ColumnMapping, desc: 'Official project title / site name' },
        { label: 'Leader / PM', field: 'leaderIndex' as keyof ColumnMapping, desc: 'Lead Project Manager responsible for the site' },
        { label: 'Vice President (VP)', field: 'vpIndex' as keyof ColumnMapping, desc: 'Executive Vice President portfolio lead' },
        { label: 'Operational Area', field: 'areaIndex' as keyof ColumnMapping, desc: 'Geographic cluster or operating zone' },
        { label: 'Project Stage', field: 'projectStageIndex' as keyof ColumnMapping, desc: 'Current phase: Excavation, Ongoing, Finishing, Handover' },
        { label: 'Area (Sqft)', field: 'areaSqftIndex' as keyof ColumnMapping, desc: 'Total built-up construction area in square feet' },
        { label: 'PM / Site Incharge', field: 'pmSiteInchargeIndex' as keyof ColumnMapping, desc: 'Designated resident engineer on site' }
      ]
    },
    {
      groupTitle: '2. Project Health, SPI & Safety Ratings',
      icon: ShieldCheck,
      fields: [
        { label: 'Project Status / Health', field: 'statusIndex' as keyof ColumnMapping, desc: 'Green (On Track), Amber (Risk), Red (Critical)' },
        { label: 'SPI Rating', field: 'spiIndex' as keyof ColumnMapping, desc: 'Schedule Performance Index score (e.g. 1.02)' },
        { label: 'Quality Rating', field: 'qualityRatingIndex' as keyof ColumnMapping, desc: 'Executive quality compliance percentage rating' },
        { label: 'Safety Rating', field: 'safetyRatingIndex' as keyof ColumnMapping, desc: 'Executive safety & HSE audit percentage rating' },
        { label: 'Avg QHSE Rating', field: 'avgQhseRatingIndex' as keyof ColumnMapping, desc: 'Combined composite QHSE rating' }
      ]
    },
    {
      groupTitle: '3. Timelines, Variances & Budgets',
      icon: Calendar,
      fields: [
        { label: 'Target / Baseline Finish Date', field: 'targetDateIndex' as keyof ColumnMapping, desc: 'Current scheduled completion deadline' },
        { label: 'Baseline 0 Finish', field: 'baselineFinishIndex' as keyof ColumnMapping, desc: 'Initial master schedule target date' },
        { label: 'Baseline 1 Finish', field: 'baseline1FinishIndex' as keyof ColumnMapping, desc: 'Revised target date after H1 review' },
        { label: 'Proposed Finish Date', field: 'proposedFinishIndex' as keyof ColumnMapping, desc: 'Current forecast handover date' },
        { label: 'Schedule Variance (Days)', field: 'scheduleVarianceIndex' as keyof ColumnMapping, desc: 'Variance days against original baseline' },
        { label: 'Delay in Current Month', field: 'delayInCurrentMonthIndex' as keyof ColumnMapping, desc: 'Days of slippage in the reporting cycle' },
        { label: 'Total Budget (Cr)', field: 'totalBudgetIndex' as keyof ColumnMapping, desc: 'Overall project estimated budget in Crores' },
        { label: 'Total Labours', field: 'totalLaboursIndex' as keyof ColumnMapping, desc: 'Cumulative peak workforce count' },
        { label: 'Total Milestones', field: 'totalMilestoneIndex' as keyof ColumnMapping, desc: 'Total contractual milestones count' }
      ]
    },
    {
      groupTitle: '4. VOWD, Milestones & Labour Deployment',
      icon: TrendingUp,
      fields: [
        { label: 'VOWD Plan (Cr)', field: 'vowdPlanIndex' as keyof ColumnMapping, desc: 'Current month planned Value of Work Done' },
        { label: 'VOWD Ach (Cr)', field: 'vowdAchIndex' as keyof ColumnMapping, desc: 'Current month achieved Value of Work Done' },
        { label: 'VOWD Ach %', field: 'vowdPctAchIndex' as keyof ColumnMapping, desc: 'Value of Work Done achievement ratio %' },
        { label: 'VOWD FR (Next Month)', field: 'vowdFrIndex' as keyof ColumnMapping, desc: 'VOWD forward target for subsequent month' },
        { label: 'Milestone Plan Count', field: 'milestonePlanIndex' as keyof ColumnMapping, desc: 'Milestones planned in reporting cycle' },
        { label: 'Milestone Ach Count', field: 'milestoneAchIndex' as keyof ColumnMapping, desc: 'Milestones achieved in reporting cycle' },
        { label: 'Milestone Ach %', field: 'milestonePctAchIndex' as keyof ColumnMapping, desc: 'Milestone completion percentage' },
        { label: 'Milestone FR (Next Month)', field: 'milestoneFrIndex' as keyof ColumnMapping, desc: 'Milestones target for subsequent month' },
        { label: 'Labour Plan Headcount', field: 'labourPlanIndex' as keyof ColumnMapping, desc: 'Required worker deployment count' },
        { label: 'Labour Actual Headcount', field: 'labourAchIndex' as keyof ColumnMapping, desc: 'Actual workers deployed on site' },
        { label: 'Labour Deployment %', field: 'labourPctAchIndex' as keyof ColumnMapping, desc: 'Labour deployment percentage' },
        { label: 'Labour FR (Next Month)', field: 'labourFrIndex' as keyof ColumnMapping, desc: 'Labour forecast for subsequent month' }
      ]
    }
  ];

  const S2_TABS_CONFIG = [
    { id: 'meta' as S2TabType, label: 'General Metadata', icon: '📋' },
    { id: 'vowd' as S2TabType, label: 'VOWD', icon: '📈' },
    { id: 'milestone' as S2TabType, label: 'Milestones', icon: '🎯' },
    { id: 'labour' as S2TabType, label: 'Labour headcount', icon: '⚒️' },
    { id: 'ur' as S2TabType, label: 'Residential UR', icon: '🏠' },
    { id: 'uc' as S2TabType, label: 'Commercial UC', icon: '🏢' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden font-sans mb-6" id="column-mapper-root">
      
      {/* Top Header Bar */}
      <div className="px-6 py-5 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100/80 shadow-2xs">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Configure Spreadsheet Headers &amp; Column Mapping
              </h2>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                Centralized
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Single configuration window for Software 1 &amp; Software 2 sheets • Updates flow to MRM &amp; Project Dashboards
            </p>
          </div>
        </div>
      </div>

      {/* Top Level Sheet Switcher (Software 1 vs Software 2) */}
      <div className="px-6 pt-4 pb-3 border-b border-slate-150 bg-slate-50/50 flex items-center gap-3">
        <button
          onClick={() => setActiveSheetTab('software2')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSheetTab === 'software2'
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Sheet 2: Software 2 (FY 26-27 Timeline &amp; Progress)</span>
        </button>

        <button
          onClick={() => setActiveSheetTab('software1')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeSheetTab === 'software1'
              ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          <span>Sheet 1: Software 1 (Master / Projectwise)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 2: SOFTWARE 2 CONFIGURATION (DEFAULT / PRIMARY) */}
      {/* ========================================================================= */}
      {activeSheetTab === 'software2' && (
        <div className="p-6 space-y-5" id="software2-config-panel">
          
          {/* Header Row Index Selector */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Software 2 Header Row Index
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                The spreadsheet row containing column headers (Row #3 / #4). Columns auto-detect based on this row.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-600">Row #</span>
              <input
                type="number"
                min="0"
                max={Math.max(10, software2SheetRows.length - 1)}
                value={software2HeaderRowIndex}
                onChange={(e) => handleS2HeaderRowChange(parseInt(e.target.value) || 0)}
                className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-xl text-sm text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
              />
              <span className="text-xs text-slate-400">
                of {software2SheetRows.length} rows (Preview: {s2HeaderRow.slice(0, 4).filter(Boolean).join(', ')}...)
              </span>
            </div>
          </div>

          {/* Clean Category Navigation Tabs Row */}
          <div className="pt-2 pb-1 border-b border-slate-150">
            <div className="flex flex-wrap items-center gap-2">
              {S2_TABS_CONFIG.map(tab => {
                const isActive = activeS2Tab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveS2Tab(tab.id);
                      setS2FilterQuery('');
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-300 ring-2 ring-blue-500/20'
                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                    }`}
                  >
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter parameters or months (e.g. Oct, R1, plan, ach, project)..."
              value={s2FilterQuery}
              onChange={(e) => setS2FilterQuery(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-2xs"
            />
            {s2FilterQuery && (
              <button
                onClick={() => setS2FilterQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Parameter Mapping Rows */}
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {visibleS2Rows.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-bold text-sm text-slate-600">No parameters matching &quot;{s2FilterQuery}&quot;</p>
                <p className="text-xs">Try searching for month names like &quot;Oct&quot;, &quot;Sep&quot;, or &quot;Plan&quot;.</p>
              </div>
            ) : (
              visibleS2Rows.map((param) => {
                const currentVal = getS2SelectedColIndex(param);
                const isAuto = isS2AutoDetected(param);
                const matchedOption = s2TotalOptions.find(o => o.idx === currentVal);
                const headerPreviewText = s2HeaderRow[currentVal] 
                  ? `"${String(s2HeaderRow[currentVal]).trim()}"` 
                  : (matchedOption ? `"${matchedOption.preview}"` : `""`);

                return (
                  <div 
                    key={param.key} 
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-slate-50/60 px-3 -mx-3 rounded-xl transition-colors"
                  >
                    {/* Left: Parameter Name & Sub-label */}
                    <div className="md:w-1/3 min-w-[200px]">
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                        {param.primaryLabel}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {param.subLabel}
                      </p>
                    </div>

                    {/* Middle: Auto-Detected Badge */}
                    <div className="md:w-1/4 flex items-center md:justify-center">
                      {isAuto ? (
                        <span className="inline-flex items-center px-3 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-black tracking-wider uppercase">
                          AUTO-DETECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-black tracking-wider uppercase">
                          MANUALLY MAPPED
                        </span>
                      )}
                    </div>

                    {/* Right: Dropdown Selector & Preview */}
                    <div className="md:w-5/12 flex flex-col items-start md:items-end">
                      <div className="relative w-full max-w-sm">
                        <select
                          value={currentVal}
                          onChange={(e) => handleS2ColChange(param, parseInt(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer appearance-none pr-8"
                        >
                          {s2TotalOptions.map(opt => (
                            <option key={opt.idx} value={opt.idx}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                        Cell value preview: <span className="text-slate-600 font-semibold">{headerPreviewText}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400">
            <span>Changes are automatically saved and applied in your active session.</span>
            <span className="font-bold text-slate-600">Software 2: 12-Month Extended Coverage</span>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SOFTWARE 1 CONFIGURATION */}
      {/* ========================================================================= */}
      {activeSheetTab === 'software1' && (
        <div className="p-6 space-y-6" id="software1-config-panel">
          
          {/* Software 1 Header Row Index Selector */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                Software 1 Header Row Index
              </label>
              <p className="text-xs text-blue-700 mt-0.5">
                The spreadsheet row containing Software 1 column labels.
              </p>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-600">Row #</span>
              <input
                type="number"
                min="0"
                max={Math.min(20, sheetRows.length - 1)}
                value={headerRowIndex}
                onChange={(e) => handleS1HeaderRowChange(parseInt(e.target.value) || 0)}
                className="w-16 px-2.5 py-1.5 border border-slate-300 rounded-xl text-sm text-center font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-2xs"
              />
              <span className="text-xs text-slate-400">
                of {sheetRows.length} rows (Preview: {s1HeaderRow.slice(0, 4).filter(Boolean).join(', ')}...)
              </span>
            </div>
          </div>

          {/* Software 1 Grouped Fields List */}
          <div className="space-y-6">
            {s1FieldGroups.map((group, gIdx) => {
              const GroupIcon = group.icon;
              return (
                <div key={gIdx} className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-200/80">
                    <div className="p-1.5 bg-white text-blue-600 rounded-lg border border-slate-200 shadow-2xs">
                      <GroupIcon className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      {group.groupTitle}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.fields.map(({ label, field, desc }) => {
                      const currentVal = mapping[field];
                      const hasMapping = currentVal !== undefined && currentVal !== -1;
                      const colLetter = hasMapping ? getColLetter(currentVal) : '';

                      return (
                        <div key={field} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">{label}</label>
                            {hasMapping ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                Col {colLetter} ({currentVal})
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                            )}
                          </div>

                          <div className="relative">
                            <select
                              value={currentVal ?? -1}
                              onChange={(e) => handleS1ColumnChange(field, parseInt(e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-7"
                            >
                              <option value="-1">-- Unassigned / Not in Sheet --</option>
                              {s1HeaderRow.map((colName, idx) => {
                                const letter = getColLetter(idx);
                                const hText = colName ? String(colName).trim() : `(Column ${idx + 1})`;
                                return (
                                  <option key={idx} value={idx}>
                                    Col {letter} [{idx}]: {hText}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                          <p className="text-[10px] text-slate-400 leading-tight">{desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="pt-3 border-t border-slate-150 flex items-center justify-between text-xs text-slate-400">
            <span>Changes are automatically saved and applied in your active session.</span>
            <span className="font-bold text-slate-600">Software 1: Master Projectwise Coverage</span>
          </div>

        </div>
      )}

    </div>
  );
}
