import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND } from '../../brand';

const PDF = BRAND.pdf;

function formatLKR(amount) {
  const num = Number(amount) || 0;
  return `LKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(date) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function compressImage(src, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export const DEFAULT_TERMS = `1. Sample Charges
Sample charges are non-refundable. Upon order confirmation, the full sample payment will be credited towards the total order value.

2. Price Adjustments
All prices are based on the approved design specifications.

3. Design & Approval
Product designs, colors, logos, and images must be provided before order confirmation. Any applicable discounts will be clearly mentioned in the quotation.

4. Bulk Order Payment Terms
50% advance payment is required to commence production. The remaining balance must be settled upon receiving the order.

5. Payment Methods
Payments can be made via Bank Transfer, Cash, Mintpay, or Koko Pay. Mintpay and Koko Pay are valid for balance payments only. Advance payments must be made via Bank Transfer, Cheque, or Cash. Payments made through Mintpay and Koko Pay will incur an additional 15% charge.

6. Quotation Validity
This quotation is valid for 7 days from the date issued.

7. Delivery & Customization
The delivery date will be specified on the invoice. All material details and customization requirements will be clearly mentioned in the quotation.

8. Alterations
If any alterations are required, products must be handed over within 7 days of delivery. All alteration requests should be arranged at once. Any further alterations after the initial 7-day period can be done free of charge by visiting the factory during working days.

9. Design Confidentiality
Client-specific designs will not be used for other clients without prior written permission.`;

function drawFooter(doc, pageWidth, pageHeight, margin, settings) {
  doc.setDrawColor(...PDF.accent);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 6, pageWidth - margin, pageHeight - 6);
  doc.setTextColor(...PDF.muted);
  doc.setFontSize(4.5);
  const footerText = [settings?.companyName || BRAND.legalName, settings?.website].filter(Boolean).join(' | ');
  doc.text(footerText, pageWidth / 2, pageHeight - 3, { align: 'center' });
}

function drawInvoiceContent(doc, data, settings, logoBase64, title) {
  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  // === WATERMARK: Logo centered, large, transparent ===
  if (logoBase64) {
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.06 }));
      doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - 40, pageHeight / 2 - 35, 80, 58);
      doc.restoreGraphicsState();
    } catch {}
  }

  // === HEADER: Company name (left, bigger) + INVOICE box (right) ===
  doc.setTextColor(...PDF.heading);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.companyName || BRAND.legalName, margin, 12);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const addr = (settings?.address || '').replace(', Sri Lanka', '');
  doc.text(addr, margin, 17);
  const tel = settings?.landline || settings?.phone || '';
  if (tel) doc.text(`Tel: ${tel}`, margin, 21);
  doc.text(settings?.email || '', margin, 25);

  // INVOICE/QUOTATION box (right, centered text)
  doc.setFillColor(...PDF.accentSoft);
  doc.setDrawColor(...PDF.border);
  doc.roundedRect(pageWidth - margin - 40, 5, 40, 20, 3, 3, 'FD');
  doc.setTextColor(...PDF.accent);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - margin - 20, 18, { align: 'center' });

  // === DIVIDER LINE ===
  let y = 34;
  doc.setDrawColor(...PDF.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // === BILL TO (left) + INVOICE META TABLE (right) ===
  y += 4;
  const snap = data.customerSnapshot || {};

  // Bill To - left side
  doc.setTextColor(...PDF.muted);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  y += 3.5;
  doc.setTextColor(...PDF.heading);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${snap.title ? snap.title + '. ' : ''}${snap.name || ''}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  let billY = y + 3.5;
  if (snap.company) { doc.setFont('helvetica', 'bold'); doc.text(snap.company, margin, billY); doc.setFont('helvetica', 'normal'); billY += 3; }
  if (snap.address) { doc.text(snap.address, margin, billY); billY += 3; }
  if (snap.phone) { doc.text(`Phone: ${snap.phone}`, margin, billY); billY += 3; }
  if (snap.email) { doc.text(`Email: ${snap.email}`, margin, billY); billY += 3; }

  // Invoice meta - right side table (matching web view alignment)
  const metaLabelX = pageWidth - margin - 42;
  const metaValX = pageWidth - margin;
  let metaY = y - 3;

  const metaRows = [
    { label: 'Invoice No', value: data.invoiceNumber || data.quotationNumber, color: PDF.accent, bold: true },
    { label: 'Date', value: fmtDate(data.invoiceDate || data.quotationDate) },
  ];
  if (data.deliveryDate) metaRows.push({ label: 'Delivery', value: fmtDate(data.deliveryDate) });
  if (data.validUntil) metaRows.push({ label: 'Valid Until', value: fmtDate(data.validUntil) });
  if (data.paymentType) metaRows.push({ label: 'Payment', value: data.paymentType });

  metaRows.forEach(row => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(row.label, metaLabelX, metaY);
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setTextColor(...(row.color || [30, 30, 30]));
    doc.text(row.value, metaValX, metaY, { align: 'right' });
    metaY += 4;
  });

  y = Math.max(billY, metaY) + 2;

  // Items table - no # column, lavender header
  const tableBody = data.items.map((item) => [
    item.name, item.quantity,
    formatLKR(item.unitPrice), item.discount > 0 ? `${item.discount}%` : '-', formatLKR(item.lineTotal)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Product / Service', 'Qty', 'Unit Price', 'Disc', 'Total']],
    body: tableBody,
    headStyles: { fillColor: PDF.accent, textColor: 255, fontSize: 5.5, fontStyle: 'bold', cellPadding: 2.5, halign: 'center' },
    alternateRowStyles: { fillColor: PDF.accentSoft },
    styles: { fontSize: 6, cellPadding: 2, textColor: [30, 30, 30], lineColor: [220, 220, 220], lineWidth: 0.1, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 12, halign: 'center' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }, theme: 'grid',
    tableLineColor: PDF.accent, tableLineWidth: 0.2
  });

  y = doc.lastAutoTable.finalY + 4;

  // PAY TO box with Total/Advance/Balance - always at bottom of page 1
  const advance = Number(data.advancePayment) || 0;
  const finalTotal = data.grandTotal;
  const balance = advance > 0 ? (finalTotal - advance) : finalTotal;
  const bankY = pageHeight - 32;
  const boxHeight = 22;

  if (settings?.bankDetails?.bankName) {
    doc.setFillColor(...PDF.accent);
    doc.roundedRect(margin, bankY, contentWidth, boxHeight, 2, 2, 'F');

    // Left side - Bank details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PAY TO:', margin + 4, bankY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank - ${settings.bankDetails.bankName}`, margin + 4, bankY + 9);
    doc.text(`Account Name - ${settings.bankDetails.accountName || ''}`, margin + 4, bankY + 13);
    doc.text(`Account Number - ${settings.bankDetails.accountNumber || ''}`, margin + 4, bankY + 17);

    // Right side - Total / Advance / Balance
    const rightX = pageWidth - margin - 45;
    const valX = pageWidth - margin - 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('Total', rightX, bankY + 6);
    doc.setFontSize(9);
    doc.text(formatLKR(finalTotal), valX, bankY + 6, { align: 'right' });

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Advance', rightX, bankY + 12);
    doc.setFontSize(7);
    doc.text(advance > 0 ? formatLKR(advance) : '', valX, bankY + 12, { align: 'right' });

    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(rightX, bankY + 14, valX, bankY + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('Balance', rightX, bankY + 19);
    doc.setFontSize(9);
    doc.text(formatLKR(balance), valX, bankY + 19, { align: 'right' });
  }

  // Footer
  drawFooter(doc, pageWidth, pageHeight, margin, settings);

  return doc;
}

function drawTermsPage(doc, settings) {
  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  doc.addPage('a5', 'portrait');

  let y = 15;
  doc.setTextColor(...PDF.heading);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Terms & Conditions', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  const termsText = (settings?.pdfTerms || '').trim() || DEFAULT_TERMS;
  const termsLines = doc.splitTextToSize(termsText, contentWidth);
  const lineHeight = 2.8;
  for (let i = 0; i < termsLines.length; i++) {
    if (y + lineHeight > pageHeight - 8) {
      drawFooter(doc, pageWidth, pageHeight, margin, settings);
      doc.addPage('a5', 'portrait');
      y = margin;
    }
    doc.text(termsLines[i], margin, y);
    y += lineHeight;
  }

  drawFooter(doc, pageWidth, pageHeight, margin, settings);
}

async function buildPdf(data, settings, title) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  let logoBase64 = null;
  try { logoBase64 = await compressImage(BRAND.logo, 200, 0.6); } catch {}
  drawInvoiceContent(doc, data, settings, logoBase64, title);
  drawTermsPage(doc, settings);
  return doc;
}

export async function generateInvoicePdf(invoice, settings) {
  const doc = await buildPdf(invoice, settings, 'INVOICE');
  doc.save(invoice.pdfFilename || `Invoice_${invoice.invoiceNumber}.pdf`);
}

export async function generateQuotationPdf(quotation, settings) {
  const doc = await buildPdf(quotation, settings, 'QUOTATION');
  doc.save(quotation.pdfFilename || `Quotation_${quotation.quotationNumber}.pdf`);
}

export async function previewInvoicePdf(invoice, settings) {
  const doc = await buildPdf(invoice, settings, 'INVOICE');
  return doc.output('bloburl');
}

export async function previewQuotationPdf(quotation, settings) {
  const doc = await buildPdf(quotation, settings, 'QUOTATION');
  return doc.output('bloburl');
}

export async function printInvoicePdf(invoice, settings) {
  const doc = await buildPdf(invoice, settings, 'INVOICE');
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}

export async function printQuotationPdf(quotation, settings) {
  const doc = await buildPdf(quotation, settings, 'QUOTATION');
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
}
