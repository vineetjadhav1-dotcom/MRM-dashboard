import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Layers, 
  CheckCircle2, 
  Check, 
  ChevronRight,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Software2Mapping } from '@/src/types';

interface MilestoneSlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  s2SheetRows: string[][];
  s2HeaderRowIndex?: number;
  software2Mapping?: Software2Mapping;
  onUpdateSoftware2Mapping?: (newMapping: Software2Mapping, newHeaderIdx: number) => void;
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

export default function MilestoneSlideDrawer({
  isOpen,
  onClose,
  s2SheetRows = [],
  s2HeaderRowIndex = 3,
  software2Mapping,
  onUpdateSoftware2Mapping
}: MilestoneSlideDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'milestone' | 'vowd' | 'labour' | 'ur' | 'uc' | 'meta'>('milestone');

  // Extract header row & parent row
  const headerRow = useMemo(() => {
    return s2SheetRows[s2HeaderRowIndex] || [];
  }, [s2SheetRows, s2HeaderRowIndex]);

  const parentRow = useMemo(() => {
    return s2HeaderRowIndex > 0 ? s2SheetRows[s2HeaderRowIndex - 1] : [];
  }, [s2SheetRows, s2HeaderRowIndex]);

  const sampleRow = useMemo(() => {
    for (let r = s2HeaderRowIndex + 1; r < s2SheetRows.length; r++) {
      if (s2SheetRows[r] && s2SheetRows[r].some(cell => String(cell || '').trim().length > 0)) {
        return s2SheetRows[r];
      }
    }
    return [];
  }, [s2SheetRows, s2HeaderRowIndex]);

  // Canonical mapping definitions for Software 2
  const CANONICAL_COLS: Record<number, { metric: string; month: string; type: string; title: string; category: string }> = useMemo(() => {
    const map: Record<number, { metric: string; month: string; type: string; title: string; category: string }> = {};

    // VOWD (Cols 18 to 47)
    const vowdMonths = [
      { m: 'Apr-26', r0: 18, ach: 19 },
      { m: 'May-26', r0: 20, ach: 21 },
      { m: 'Jun-26', r0: 22, ach: 23 },
      { m: 'Jul-26', r0: 24, ach: 25 },
      { m: 'Aug-26', r0: 26, ach: 27 },
      { m: 'Sep-26', r0: 28, ach: 29 },
      { m: 'Oct-26', r0: 30, r1: 31, ach: 32 },
      { m: 'Nov-26', r0: 33, r1: 34, ach: 35 },
      { m: 'Dec-26', r0: 36, r1: 37, ach: 38 },
      { m: 'Jan-27', r0: 39, r1: 40, ach: 41 },
      { m: 'Feb-27', r0: 42, r1: 43, ach: 44 },
      { m: 'Mar-27', r0: 45, r1: 46, ach: 47 }
    ];
    vowdMonths.forEach(item => {
      map[item.r0] = { metric: 'vowd', month: item.m, type: 'planR0', title: `VOWD ${item.m.replace('-26','').replace('-27','')} R0 Plan`, category: 'vowd' };
      if (item.r1 !== undefined) {
        map[item.r1] = { metric: 'vowd', month: item.m, type: 'planR1', title: `VOWD ${item.m.replace('-26','').replace('-27','')} R1 Plan`, category: 'vowd' };
      }
      map[item.ach] = { metric: 'vowd', month: item.m, type: 'achievement', title: `VOWD ${item.m.replace('-26','').replace('-27','')} Ach`, category: 'vowd' };
    });

    // Milestones (Cols 57 to 86)
    const msMonths = [
      { m: 'Apr-26', r0: 57, ach: 58 },
      { m: 'May-26', r0: 59, ach: 60 },
      { m: 'Jun-26', r0: 61, ach: 62 },
      { m: 'Jul-26', r0: 63, ach: 64 },
      { m: 'Aug-26', r0: 65, ach: 66 },
      { m: 'Sep-26', r0: 67, ach: 68 },
      { m: 'Oct-26', r0: 69, r1: 70, ach: 71 },
      { m: 'Nov-26', r0: 72, r1: 73, ach: 74 },
      { m: 'Dec-26', r0: 75, r1: 76, ach: 77 },
      { m: 'Jan-27', r0: 78, r1: 79, ach: 80 },
      { m: 'Feb-27', r0: 81, r1: 82, ach: 83 },
      { m: 'Mar-27', r0: 84, r1: 85, ach: 86 }
    ];
    msMonths.forEach(item => {
      map[item.r0] = { metric: 'milestone', month: item.m, type: 'planR0', title: `Milestone ${item.m.replace('-26','').replace('-27','')} R0 Plan`, category: 'milestone' };
      if (item.r1 !== undefined) {
        map[item.r1] = { metric: 'milestone', month: item.m, type: 'planR1', title: `Milestone ${item.m.replace('-26','').replace('-27','')} R1 Plan`, category: 'milestone' };
      }
      map[item.ach] = { metric: 'milestone', month: item.m, type: 'achievement', title: `Milestone ${item.m.replace('-26','').replace('-27','')} Ach`, category: 'milestone' };
    });

    // Residential Delivery - UR (Cols 95 to 124)
    const urMonths = [
      { m: 'Apr-26', r0: 95, ach: 96 },
      { m: 'May-26', r0: 97, ach: 98 },
      { m: 'Jun-26', r0: 99, ach: 100 },
      { m: 'Jul-26', r0: 101, ach: 102 },
      { m: 'Aug-26', r0: 103, ach: 104 },
      { m: 'Sep-26', r0: 105, ach: 106 },
      { m: 'Oct-26', r0: 107, r1: 108, ach: 109 },
      { m: 'Nov-26', r0: 110, r1: 111, ach: 112 },
      { m: 'Dec-26', r0: 113, r1: 114, ach: 115 },
      { m: 'Jan-27', r0: 116, r1: 117, ach: 118 },
      { m: 'Feb-27', r0: 119, r1: 120, ach: 121 },
      { m: 'Mar-27', r0: 122, r1: 123, ach: 124 }
    ];
    urMonths.forEach(item => {
      map[item.r0] = { metric: 'ur', month: item.m, type: 'planR0', title: `UR ${item.m.replace('-26','').replace('-27','')} R0 Plan`, category: 'ur' };
      if (item.r1 !== undefined) {
        map[item.r1] = { metric: 'ur', month: item.m, type: 'planR1', title: `UR ${item.m.replace('-26','').replace('-27','')} R1 Plan`, category: 'ur' };
      }
      map[item.ach] = { metric: 'ur', month: item.m, type: 'achievement', title: `UR ${item.m.replace('-26','').replace('-27','')} Ach`, category: 'ur' };
    });

    // Commercial Delivery - UC (Cols 132 to 161)
    const ucMonths = [
      { m: 'Apr-26', r0: 132, ach: 133 },
      { m: 'May-26', r0: 134, ach: 135 },
      { m: 'Jun-26', r0: 136, ach: 137 },
      { m: 'Jul-26', r0: 138, ach: 139 },
      { m: 'Aug-26', r0: 140, ach: 141 },
      { m: 'Sep-26', r0: 142, ach: 143 },
      { m: 'Oct-26', r0: 144, r1: 145, ach: 146 },
      { m: 'Nov-26', r0: 147, r1: 148, ach: 149 },
      { m: 'Dec-26', r0: 150, r1: 151, ach: 152 },
      { m: 'Jan-27', r0: 153, r1: 154, ach: 155 },
      { m: 'Feb-27', r0: 156, r1: 157, ach: 158 },
      { m: 'Mar-27', r0: 159, r1: 160, ach: 161 }
    ];
    ucMonths.forEach(item => {
      map[item.r0] = { metric: 'uc', month: item.m, type: 'planR0', title: `UC ${item.m.replace('-26','').replace('-27','')} R0 Plan`, category: 'uc' };
      if (item.r1 !== undefined) {
        map[item.r1] = { metric: 'uc', month: item.m, type: 'planR1', title: `UC ${item.m.replace('-26','').replace('-27','')} R1 Plan`, category: 'uc' };
      }
      map[item.ach] = { metric: 'uc', month: item.m, type: 'achievement', title: `UC ${item.m.replace('-26','').replace('-27','')} Ach`, category: 'uc' };
    });

    // Labour (Cols 228 to 258)
    const labMonths = [
      { m: 'Apr-26', r0: 228, ach: 229 },
      { m: 'May-26', r0: 230, ach: 231 },
      { m: 'Jun-26', r0: 232, ach: 233 },
      { m: 'Jul-26', r0: 234, ach: 235 },
      { m: 'Aug-26', r0: 236, ach: 237 },
      { m: 'Sep-26', r0: 238, ach: 239 },
      { m: 'Oct-26', r0: 241, r1: 242, ach: 243 },
      { m: 'Nov-26', r0: 244, r1: 245, ach: 246 },
      { m: 'Dec-26', r0: 247, r1: 248, ach: 249 },
      { m: 'Jan-27', r0: 250, r1: 251, ach: 252 },
      { m: 'Feb-27', r0: 253, r1: 254, ach: 255 },
      { m: 'Mar-27', r0: 256, r1: 257, ach: 258 }
    ];
    labMonths.forEach(item => {
      map[item.r0] = { metric: 'labour', month: item.m, type: 'planR0', title: `Labour ${item.m.replace('-26','').replace('-27','')} R0 Plan`, category: 'labour' };
      if (item.r1 !== undefined) {
        map[item.r1] = { metric: 'labour', month: item.m, type: 'planR1', title: `Labour ${item.m.replace('-26','').replace('-27','')} R1 Plan`, category: 'labour' };
      }
      map[item.ach] = { metric: 'labour', month: item.m, type: 'achievement', title: `Labour ${item.m.replace('-26','').replace('-27','')} Ach`, category: 'labour' };
    });

    // Metadata
    map[1] = { metric: 'code', month: '', type: 'meta', title: 'Project ID', category: 'meta' };
    map[2] = { metric: 'name', month: '', type: 'meta', title: 'Project', category: 'meta' };
    map[3] = { metric: 'leader', month: '', type: 'meta', title: 'Leader', category: 'meta' };
    map[4] = { metric: 'vp', month: '', type: 'meta', title: 'VP', category: 'meta' };
    map[5] = { metric: 'stage', month: '', type: 'meta', title: 'Project Stage', category: 'meta' };

    return map;
  }, []);

  // Filter column cards based on category and search query
  const columnItems = useMemo(() => {
    const totalCols = Math.max(headerRow.length, 260);
    const items: Array<{
      idx: number;
      colLetter: string;
      headerText: string;
      parentText: string;
      sampleVal: string;
      canonical: { metric: string; month: string; type: string; title: string; category: string } | null;
      isMapped: boolean;
    }> = [];

    for (let idx = 0; idx < totalCols; idx++) {
      const colLetter = getColLetter(idx);
      const headerText = String(headerRow[idx] || '').trim();
      const parentText = String(parentRow[idx] || '').trim();
      const sampleVal = String(sampleRow[idx] || '').trim();
      const canonical = CANONICAL_COLS[idx] || null;

      // Filter by category
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'milestone' && (!canonical || canonical.category !== 'milestone')) {
          if (!/milestone|mil\b|ms\b/i.test(headerText + ' ' + parentText)) continue;
        } else if (selectedCategory === 'vowd' && (!canonical || canonical.category !== 'vowd')) {
          if (!/vowd/i.test(headerText + ' ' + parentText)) continue;
        } else if (selectedCategory === 'labour' && (!canonical || canonical.category !== 'labour')) {
          if (!/labour|labor|lab\b/i.test(headerText + ' ' + parentText)) continue;
        } else if (selectedCategory === 'ur' && (!canonical || canonical.category !== 'ur')) {
          if (!/\bur\b|residential/i.test(headerText + ' ' + parentText)) continue;
        } else if (selectedCategory === 'uc' && (!canonical || canonical.category !== 'uc')) {
          if (!/\buc\b|commercial/i.test(headerText + ' ' + parentText)) continue;
        } else if (selectedCategory === 'meta' && (!canonical || canonical.category !== 'meta')) {
          if (idx > 10) continue;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery = 
          colLetter.toLowerCase().includes(query) ||
          `col ${colLetter.toLowerCase()}`.includes(query) ||
          idx.toString() === query ||
          headerText.toLowerCase().includes(query) ||
          parentText.toLowerCase().includes(query) ||
          sampleVal.toLowerCase().includes(query) ||
          (canonical && canonical.title.toLowerCase().includes(query));
        
        if (!matchesQuery) continue;
      }

      items.push({
        idx,
        colLetter,
        headerText,
        parentText,
        sampleVal,
        canonical,
        isMapped: !!canonical
      });
    }

    return items;
  }, [headerRow, parentRow, sampleRow, CANONICAL_COLS, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="milestone-slide-drawer-root">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-4xl bg-white shadow-2xl flex flex-col border-l border-slate-200 transform transition-transform ease-in-out duration-300">
          
          {/* Top Sliding Drawer Header */}
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                    Software 2 Sheet Explorer
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">• Covering 300+ Google Sheet Columns</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                  Milestone &amp; Metric Header Sliding Window
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filter & Search Bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search headers, column letters (e.g. 'BH', 'Col 57', 'Milestone Oct', 'R0 Plan')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Status info */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  Showing <span className="text-blue-600 font-extrabold">{columnItems.length}</span> Columns
                </span>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'milestone', label: 'Milestones (Cols 57-86)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { id: 'vowd', label: 'VOWD (Cols 18-47)', color: 'text-violet-700 bg-violet-50 border-violet-200' },
                { id: 'labour', label: 'Labour (Cols 228-258)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { id: 'ur', label: 'Unit Delivery - Residential (Cols 95-124)', color: 'text-orange-700 bg-orange-50 border-orange-200' },
                { id: 'uc', label: 'Unit Delivery - Commercial (Cols 132-161)', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: 'meta', label: 'Metadata (Project ID, Name, Leader, VP, Stage)', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                { id: 'all', label: 'All Google Sheet Headers', color: 'text-slate-700 bg-white border-slate-200' },
              ].map((tab) => {
                const isSelected = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `${tab.color} hover:brightness-95`
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {columnItems.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border border-slate-200 rounded-3xl p-8 text-slate-500 space-y-2">
                <Search className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No columns matching &quot;{searchQuery}&quot;</p>
                <p className="text-xs text-slate-400">Try changing your search term or select another category above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {columnItems.map((item) => {
                  return (
                    <div 
                      key={item.idx}
                      className={`border rounded-2xl p-4 transition-all space-y-2 relative group ${
                        item.canonical
                          ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      {/* Top Header Row in Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-900 text-white rounded-md shadow-2xs">
                            Col {item.colLetter}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 font-bold">
                            Index #{item.idx}
                          </span>
                        </div>

                        {item.canonical ? (
                          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Check className="w-3 h-3 mr-1 text-emerald-600" />
                            Auto-Mapped
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            Unmapped
                          </span>
                        )}
                      </div>

                      {/* Header Name & Category */}
                      <div>
                        <span className="text-xs font-black text-slate-900 block truncate" title={item.headerText || `Column ${item.idx + 1}`}>
                          {item.headerText || `(Header at Index ${item.idx})`}
                        </span>
                        {item.parentText && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            Parent: <span className="font-semibold text-slate-600">{item.parentText}</span>
                          </span>
                        )}
                      </div>

                      {/* Canonical binding description */}
                      {item.canonical && (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2 text-[11px] flex items-center justify-between text-blue-900 font-bold">
                          <span className="truncate">{item.canonical.title}</span>
                          <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0 ml-2">
                            {item.canonical.type === 'planR0' ? 'R0 Plan' : item.canonical.type === 'planR1' ? 'R1 Plan (H2)' : 'Achievement'}
                          </span>
                        </div>
                      )}

                      {/* Live sample data value */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 border-t border-slate-100">
                        <span className="font-medium">Live Sample Value:</span>
                        <span className="font-bold font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {item.sampleVal !== '' ? item.sampleVal : '(empty / zero)'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Software 2 Sheet:</span> Connected with 142 projects across 12 fiscal months.
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Done / Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
