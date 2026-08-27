/**
 * Robust RFC 4180 compliant CSV parser that handles quotes, commas, and linebreaks inside cells.
 */
export function parseCsvText(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuote = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }
  return rows;
}

/**
 * Parse text copied directly from Google Sheets (Ctrl+C).
 * Google Sheets copies tab-delimited values (\t) with newline rows (\n).
 */
export function parsePastedSheetText(pastedText: string): string[][] {
  if (!pastedText || pastedText.trim().length === 0) return [];
  
  // If it contains tabs, parse as TSV (Tab Separated Values from Google Sheets)
  if (pastedText.includes('\t')) {
    const lines = pastedText.split(/\r?\n/);
    const rows: string[][] = [];
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const cells = line.split('\t').map(c => {
        let val = c.trim();
        // Remove surrounding quotes if present
        if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
          val = val.slice(1, -1).replace(/""/g, '"');
        }
        return val;
      });
      if (cells.some(c => c.length > 0)) {
        rows.push(cells);
      }
    }
    return rows;
  }
  
  // Otherwise parse as standard CSV
  return parseCsvText(pastedText);
}
