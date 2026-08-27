import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
export { generateFullMRMReport } from './mrmPdfCompiler';
export type { MRMReportExportOptions } from './mrmPdfCompiler';

export interface PdfExportOptions {
  elementId?: string;
  filename?: string;
  leaderName?: string;
  vpName?: string;
}

/**
 * High-resolution PDF Exporter for A4 Landscape reports.
 * Uses html2canvas + jsPDF with multi-page support, Blob URL download,
 * and browser print fallback for max compatibility.
 */
export async function generatePdfReport(options: PdfExportOptions = {}): Promise<void> {
  const {
    elementId = 'leaderwise-dashboard-root',
    filename,
    leaderName,
    vpName
  } = options;

  // Locate target element
  let element = document.getElementById(elementId);
  if (!element) {
    element = document.getElementById('main-content-area') || document.body;
  }

  // Dynamic file name construction
  const timestamp = new Date().toISOString().slice(0, 10);
  const filterLabel = leaderName && leaderName !== 'all' 
    ? `Leader_${leaderName.replace(/\s+/g, '_')}` 
    : vpName && vpName !== 'all' 
      ? `VP_${vpName.replace(/\s+/g, '_')}` 
      : 'Consolidated_Portfolio';
  
  const finalFilename = filename || `Planedge_MRM_Report_${filterLabel}_${timestamp}.pdf`;

  // Apply print export class to body to show print headers and hide action buttons
  document.body.classList.add('is-exporting-pdf');

  // Ensure header print element is explicitly visible during capture
  const printHeader = document.getElementById('mrm-print-header');
  let originalHeaderDisplay = '';
  if (printHeader) {
    originalHeaderDisplay = printHeader.style.display;
    printHeader.style.display = 'block';
  }

  try {
    // Wait briefly for layout reflow and font rendering
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Calculate full scroll dimensions to avoid any height truncation
    const totalScrollHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight,
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    const totalScrollWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth,
      1280
    );

    const COLOR_PROPS = [
      'color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderBottomColor',
      'borderLeftColor', 'borderRightColor', 'fill', 'stroke', 'boxShadow', 'textDecorationColor', 'outlineColor'
    ];

    const sanitizeOklch = (rootEl: HTMLElement) => {
      const helperCanvas = document.createElement('canvas');
      const ctx = helperCanvas.getContext('2d');
      if (!ctx) return;

      const convertVal = (str: string): string => {
        if (!str || !str.includes('oklch')) return str;
        return str.replace(/oklch\([^)]+\)/gi, (match) => {
          try {
            ctx.fillStyle = '#000000';
            ctx.fillStyle = match;
            return ctx.fillStyle || '#3b82f6';
          } catch {
            return '#3b82f6';
          }
        });
      };

      const elements = [rootEl, ...Array.from(rootEl.querySelectorAll('*'))] as HTMLElement[];
      elements.forEach((el) => {
        const comp = window.getComputedStyle(el);
        COLOR_PROPS.forEach((prop) => {
          const val = (comp as any)[prop];
          if (val && typeof val === 'string' && val.includes('oklch')) {
            (el.style as any)[prop] = convertVal(val);
          }
        });
      });
    };

    sanitizeOklch(element as HTMLElement);

    // Capture target element to canvas with explicit unconstrained dimensions
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: totalScrollWidth,
      height: totalScrollHeight,
      windowWidth: totalScrollWidth,
      windowHeight: totalScrollHeight + 200,
      onclone: (_clonedDoc, clonedElement) => {
        if (clonedElement) {
          sanitizeOklch(clonedElement as HTMLElement);
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // Create jsPDF document for A4 Landscape
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    const margin = 10; // 10mm margins
    const printableWidth = pdfWidth - margin * 2; // 277 mm
    const printableHeight = pdfHeight - margin * 2; // 190 mm

    const imgWidth = printableWidth;
    const imgHeight = (canvas.height * printableWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // Render first page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= printableHeight;

    // Render additional pages if content spans beyond 1 page
    while (heightLeft > 0) {
      position = position - printableHeight; // Shift image upwards for next page view
      pdf.addPage('a4', 'landscape');
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= printableHeight;
    }

    // Attempt direct save
    try {
      pdf.save(finalFilename);
    } catch (saveError) {
      console.warn('pdf.save failed:', saveError);
    }

    // Blob & Blob URL trigger for sandboxed iframe environments
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = finalFilename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // If inside an iframe (preview window), also open PDF in a new tab so user can view/save directly
    if (window.self !== window.top) {
      const newWin = window.open(blobUrl, '_blank');
      if (!newWin) {
        // If popup was blocked, fallback to browser print dialog
        window.print();
      }
    }

    setTimeout(() => {
      if (document.body.contains(downloadLink)) {
        document.body.removeChild(downloadLink);
      }
    }, 2000);

  } catch (err) {
    console.error('PDF generation error, falling back to window.print():', err);
    try {
      window.print();
    } catch (printErr) {
      console.error('window.print fallback failed:', printErr);
      alert('To save as PDF, please open this app in a new tab or use Ctrl+P / Cmd+P to Print -> Save as PDF.');
    }
  } finally {
    // Restore UI
    document.body.classList.remove('is-exporting-pdf');
    if (printHeader) {
      printHeader.style.display = originalHeaderDisplay;
    }
  }
}
