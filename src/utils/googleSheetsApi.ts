import { parseCsvText } from './csvParser';

export const TARGET_SPREADSHEET_ID = '1BDEpLJk9tIo9Y-CxJYksR2GRjaCuQalr1p2ZNTI5AJA';
export const TAB_SOFTWARE_1 = 'Software1';
export const TAB_SOFTWARE_2 = 'Software2';
export const TAB_SOFTWARE_3 = 'Software3';

/**
 * Parse Google Visualization API JSON response into a 2D string matrix
 */
export function parseGvizResponse(gvizText: string): string[][] {
  const jsonMatch = gvizText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);?/);
  if (!jsonMatch) {
    throw new Error('Unable to parse Google Sheets response format.');
  }
  const data = JSON.parse(jsonMatch[1]);
  if (data.status === 'error') {
    throw new Error(data.errors?.[0]?.detailed_message || data.errors?.[0]?.message || 'Google Sheets error');
  }

  const resultRows: string[][] = [];

  // Check if header labels exist in cols
  const headerRow: string[] = (data.table.cols || []).map((col: any) => col.label || '');
  const hasColLabels = headerRow.some((lbl: string) => lbl.trim().length > 0);
  if (hasColLabels) {
    resultRows.push(headerRow);
  }

  // Extract all rows
  (data.table.rows || []).forEach((rowObj: any) => {
    const rowCells: string[] = [];
    const cells = rowObj.c || [];
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (!cell || cell === null) {
        rowCells.push('');
      } else {
        const val = cell.f !== undefined && cell.f !== null 
          ? String(cell.f) 
          : (cell.v !== undefined && cell.v !== null ? String(cell.v) : '');
        rowCells.push(val);
      }
    }
    resultRows.push(rowCells);
  });

  return resultRows;
}

/**
 * Attempt direct fetch of Google Sheet tab using Google Visualization endpoint or CSV export
 */
export async function fetchPublicGoogleSheet(spreadsheetId: string, sheetTab: string): Promise<string[][]> {
  // Method 1: Google Visualization Query endpoint
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetTab)}`;
  
  try {
    const res = await fetch(gvizUrl);
    if (res.ok) {
      const text = await res.text();
      if (text.includes('google.visualization.Query.setResponse')) {
        return parseGvizResponse(text);
      }
    }
  } catch (e) {
    console.warn(`GViz fetch failed for tab ${sheetTab}:`, e);
  }

  // Method 2: Direct CSV Export URL
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&sheet=${encodeURIComponent(sheetTab)}`;
  try {
    const res = await fetch(csvUrl);
    if (res.ok) {
      const text = await res.text();
      const rows = parseCsvText(text);
      if (rows.length > 0) {
        return rows;
      }
    }
  } catch (e) {
    console.warn(`CSV export fetch failed for tab ${sheetTab}:`, e);
  }

  throw new Error(
    `Cannot access "${sheetTab}" directly. Google Sheets returned 401/403. Please ensure the sheet's Share settings are set to "Anyone with the link can view".`
  );
}

/**
 * Fetch authenticated Google Sheet using OAuth Access Token
 */
export async function fetchAuthenticatedGoogleSheet(
  spreadsheetId: string, 
  sheetTab: string, 
  accessToken: string
): Promise<string[][]> {
  const range = `${sheetTab}!A1:ZZ1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson?.error?.message || `Google Sheets API Error (Status ${res.status})`);
  }

  const data = await res.json();
  return data.values || [];
}
