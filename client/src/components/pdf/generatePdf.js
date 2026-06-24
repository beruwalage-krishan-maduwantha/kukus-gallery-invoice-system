import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const TERMS_TEXT = `1. Sample Charges
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

export async function generateInvoicePdf(invoice, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  let logoBase64 = null;
  try {
    logoBase64 = await compressImage('/logo.png', 200, 0.6);
  } catch {}

  // === HEADER BAR (purple) ===
  doc.setFillColor(44, 22, 64);
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Logo left side
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'JPEG', margin, 3, 22, 26); } catch {}
  }

  // Company details - RIGHT side of header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.companyName || 'Kukus Gallery Pvt Ltd', pageWidth - margin, 8, { align: 'right' });

  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.address || '484/8/F Wettasinghe Gardens, Pitakotte, Sri Lanka', pageWidth - margin, 13, { align: 'right' });
  doc.text(`Tel: ${settings?.phone || '076 861 4050 / 077 698 6155'}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Email: ${settings?.email || 'info@kukusgallery.com'}`, pageWidth - margin, 21, { align: 'right' });
  if (settings?.website) doc.text(`Web: ${settings.website}`, pageWidth - margin, 25, { align: 'right' });

  // === INVOICE DETAILS (white area below header) ===
  let y = 37;

  // Invoice title + number
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(177, 145, 198);
  doc.text(invoice.invoiceNumber, margin + 36, y);

  // Invoice meta - right aligned
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${fmtDate(invoice.invoiceDate)}`, pageWidth - margin, y - 3, { align: 'right' });
  if (invoice.deliveryDate) doc.text(`Delivery: ${fmtDate(invoice.deliveryDate)}`, pageWidth - margin, y + 1, { align: 'right' });
  doc.text(`Payment: ${invoice.paymentType || 'Cash'}`, pageWidth - margin, y + 5, { align: 'right' });

  // Divider
  y += 8;
  doc.setDrawColor(212, 189, 227);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // === BILL TO ===
  y += 4;
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);

  const snap = invoice.customerSnapshot || {};
  y += 3.5;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(snap.name || '', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  y += 3.5;
  if (snap.address) { doc.text(snap.address, margin, y); y += 3; }
  if (snap.phone) { doc.text(`Phone: ${snap.phone}`, margin, y); y += 3; }
  if (snap.email) { doc.text(`Email: ${snap.email}`, margin, y); y += 3; }
  if (snap.company) { doc.text(`Company: ${snap.company}`, margin, y); y += 3; }

  y += 2;

  // === ITEMS TABLE ===
  const tableBody = invoice.items.map((item, i) => [
    i + 1,
    item.name,
    item.orderType,
    item.quantity,
    formatLKR(item.unitPrice),
    item.discount > 0 ? `${item.discount}%` : '-',
    formatLKR(item.lineTotal)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product / Service', 'Type', 'Qty', 'Unit Price', 'Disc', 'Total']],
    body: tableBody,
    headStyles: {
      fillColor: [44, 22, 64],
      textColor: 255,
      fontSize: 5.5,
      fontStyle: 'bold',
      cellPadding: 1.8
    },
    alternateRowStyles: { fillColor: [248, 244, 251] },
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      textColor: [30, 30, 30],
      lineColor: [230, 230, 230],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 9, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 9, halign: 'center' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid'
  });

  y = doc.lastAutoTable.finalY + 4;

  // === TOTALS ===
  const summaryX = pageWidth - margin - 55;
  doc.setFontSize(6.5);

  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatLKR(invoice.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 4;

  if (invoice.discountAmount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text(`Discount ${invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:`, summaryX, y);
    doc.text(`- ${formatLKR(invoice.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }

  // Grand Total bar
  y += 1;
  doc.setFillColor(177, 145, 198);
  doc.roundedRect(summaryX - 3, y - 3, contentWidth - summaryX + margin + 3, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX, y + 2);
  doc.text(formatLKR(invoice.grandTotal), pageWidth - margin, y + 2, { align: 'right' });

  y += 12;

  // === NOTES ===
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  if (invoice.notes) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', margin, y);
    y += 3;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 2.5 + 2;
  }

  // === BANK DETAILS ===
  if (settings?.bankDetails?.bankName) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    doc.text('BANK DETAILS', margin, y);
    y += 3;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.bankDetails.bankName} | Account: ${settings.bankDetails.accountNumber || ''} | Name: ${settings.bankDetails.accountName || ''}`, margin, y);
    y += 5;
  }

  // === TERMS & CONDITIONS (new page if needed) ===
  if (y > pageHeight - 60) {
    doc.addPage('a5', 'portrait');
    y = margin;
  }

  doc.setTextColor(154, 123, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('TERMS & CONDITIONS', margin, y);
  y += 3;

  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  const termsLines = doc.splitTextToSize(TERMS_TEXT, contentWidth);

  const lineHeight = 2.2;
  for (let i = 0; i < termsLines.length; i++) {
    if (y + lineHeight > pageHeight - 8) {
      doc.addPage('a5', 'portrait');
      y = margin;
    }
    doc.text(termsLines[i], margin, y);
    y += lineHeight;
  }

  // === FOOTER on last page ===
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(177, 145, 198);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 6, pageWidth - margin, pageHeight - 6);
    doc.setTextColor(154, 123, 175);
    doc.setFontSize(4.5);
    doc.text(
      `${settings?.companyName || 'Kukus Gallery Pvt Ltd'} | ${settings?.website || 'www.kukusgallery.com'}`,
      pageWidth / 2, pageHeight - 3, { align: 'center' }
    );
  }

  doc.save(invoice.pdfFilename || `Invoice_${invoice.invoiceNumber}.pdf`);
}

export async function generateQuotationPdf(quotation, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  let logoBase64 = null;
  try { logoBase64 = await compressImage('/logo.png', 200, 0.6); } catch {}

  doc.setFillColor(44, 22, 64);
  doc.rect(0, 0, pageWidth, 32, 'F');

  if (logoBase64) { try { doc.addImage(logoBase64, 'JPEG', margin, 3, 22, 26); } catch {} }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.companyName || 'Kukus Gallery Pvt Ltd', pageWidth - margin, 8, { align: 'right' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.address || '', pageWidth - margin, 13, { align: 'right' });
  doc.text(`Tel: ${settings?.phone || ''}`, pageWidth - margin, 17, { align: 'right' });
  doc.text(`Email: ${settings?.email || ''}`, pageWidth - margin, 21, { align: 'right' });
  if (settings?.website) doc.text(`Web: ${settings.website}`, pageWidth - margin, 25, { align: 'right' });

  let y = 37;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', margin, y);

  doc.setFontSize(9);
  doc.setTextColor(177, 145, 198);
  doc.text(quotation.quotationNumber, margin + 46, y);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${fmtDate(quotation.quotationDate)}`, pageWidth - margin, y - 3, { align: 'right' });
  doc.text(`Valid Until: ${fmtDate(quotation.validUntil)}`, pageWidth - margin, y + 1, { align: 'right' });
  if (quotation.deliveryDate) doc.text(`Delivery: ${fmtDate(quotation.deliveryDate)}`, pageWidth - margin, y + 5, { align: 'right' });

  y += 8;
  doc.setDrawColor(212, 189, 227);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  const snap = quotation.customerSnapshot || {};
  y += 4;
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  y += 3.5;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(8);
  doc.text(snap.name || '', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  y += 3.5;
  if (snap.address) { doc.text(snap.address, margin, y); y += 3; }
  if (snap.phone) { doc.text(`Phone: ${snap.phone}`, margin, y); y += 3; }
  if (snap.email) { doc.text(`Email: ${snap.email}`, margin, y); y += 3; }
  y += 2;

  const tableBody = quotation.items.map((item, i) => [
    i + 1, item.name, item.orderType, item.quantity,
    formatLKR(item.unitPrice), item.discount > 0 ? `${item.discount}%` : '-', formatLKR(item.lineTotal)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product / Service', 'Type', 'Qty', 'Unit Price', 'Disc', 'Total']],
    body: tableBody,
    headStyles: { fillColor: [44, 22, 64], textColor: 255, fontSize: 5.5, fontStyle: 'bold', cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [248, 244, 251] },
    styles: { fontSize: 6, cellPadding: 1.5, textColor: [30, 30, 30], lineColor: [230, 230, 230], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' }, 2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 9, halign: 'center' }, 4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 9, halign: 'center' }, 6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }, theme: 'grid'
  });

  y = doc.lastAutoTable.finalY + 4;
  const summaryX = pageWidth - margin - 55;
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatLKR(quotation.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 4;
  if (quotation.discountAmount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text(`Discount ${quotation.discountType === 'percentage' ? `(${quotation.discountValue}%)` : ''}:`, summaryX, y);
    doc.text(`- ${formatLKR(quotation.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }
  y += 1;
  doc.setFillColor(177, 145, 198);
  doc.roundedRect(summaryX - 3, y - 3, contentWidth - summaryX + margin + 3, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX, y + 2);
  doc.text(formatLKR(quotation.grandTotal), pageWidth - margin, y + 2, { align: 'right' });
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  if (quotation.notes) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', margin, y);
    y += 3;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(quotation.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 2.5 + 2;
  }

  if (y > pageHeight - 60) { doc.addPage('a5', 'portrait'); y = margin; }

  doc.setTextColor(154, 123, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('TERMS & CONDITIONS', margin, y);
  y += 3;
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.5);
  const termsLines = doc.splitTextToSize(TERMS_TEXT, contentWidth);
  const lineHeight = 2.2;
  for (let i = 0; i < termsLines.length; i++) {
    if (y + lineHeight > pageHeight - 8) { doc.addPage('a5', 'portrait'); y = margin; }
    doc.text(termsLines[i], margin, y);
    y += lineHeight;
  }

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(177, 145, 198);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 6, pageWidth - margin, pageHeight - 6);
    doc.setTextColor(154, 123, 175);
    doc.setFontSize(4.5);
    doc.text(`${settings?.companyName || 'Kukus Gallery Pvt Ltd'} | ${settings?.website || 'www.kukusgallery.com'}`, pageWidth / 2, pageHeight - 3, { align: 'center' });
  }

  doc.save(quotation.pdfFilename || `Quotation_${quotation.quotationNumber}.pdf`);
}
