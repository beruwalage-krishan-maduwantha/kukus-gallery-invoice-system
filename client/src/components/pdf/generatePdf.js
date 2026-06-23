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

export async function generateInvoicePdf(invoice, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let logoBase64 = null;
  try {
    const response = await fetch('/logo.png');
    const blob = await response.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load logo:', e);
  }

  // Header background
  doc.setFillColor(44, 22, 64);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo
  if (logoBase64) {
    try { doc.addImage(logoBase64, 'PNG', margin, 8, 30, 30); } catch {}
  }

  // Company details
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.companyName || 'Kukus Gallery Pvt Ltd', margin + 35, 18);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.address || '', margin + 35, 24);
  doc.text(`Tel: ${settings?.phone || ''}`, margin + 35, 28);
  doc.text(`Email: ${settings?.email || ''}`, margin + 35, 32);
  if (settings?.website) doc.text(`Web: ${settings.website}`, margin + 35, 36);

  // Invoice title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 18, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoiceNumber, pageWidth - margin, 26, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date: ${fmtDate(invoice.invoiceDate)}`, pageWidth - margin, 32, { align: 'right' });
  if (invoice.dueDate) doc.text(`Due: ${fmtDate(invoice.dueDate)}`, pageWidth - margin, 36, { align: 'right' });
  doc.text(`Terms: ${invoice.paymentTerms || 'Net 30'}`, pageWidth - margin, 40, { align: 'right' });

  // Bill To section
  let y = 58;
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);

  const snap = invoice.customerSnapshot || {};
  y += 5;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(snap.name || '', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  y += 5;
  if (snap.address) { doc.text(snap.address, margin, y); y += 4; }
  if (snap.phone) { doc.text(`Phone: ${snap.phone}`, margin, y); y += 4; }
  if (snap.email) { doc.text(`Email: ${snap.email}`, margin, y); y += 4; }
  if (snap.company) { doc.text(`Company: ${snap.company}`, margin, y); y += 4; }

  // Divider
  y += 3;
  doc.setDrawColor(177, 145, 198);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Items table
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
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 3
    },
    alternateRowStyles: { fillColor: [248, 244, 251] },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 30, 30],
      lineColor: [230, 230, 230],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid'
  });

  y = doc.lastAutoTable.finalY + 8;

  // Summary section
  const summaryX = pageWidth - margin - 70;
  doc.setFontSize(8.5);

  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatLKR(invoice.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 6;

  if (invoice.discountAmount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text(`Discount ${invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}:`, summaryX, y);
    doc.text(`- ${formatLKR(invoice.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    y += 6;
  }

  // Grand Total bar
  y += 2;
  doc.setFillColor(177, 145, 198);
  doc.roundedRect(summaryX - 5, y - 4, contentWidth - summaryX + margin + 5, 12, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX, y + 3);
  doc.text(formatLKR(invoice.grandTotal), pageWidth - margin, y + 3, { align: 'right' });

  y += 20;

  // Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  if (invoice.notes) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', margin, y);
    y += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 3.5 + 4;
  }

  if (invoice.terms) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS', margin, y);
    y += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const termLines = doc.splitTextToSize(invoice.terms, contentWidth);
    doc.text(termLines, margin, y);
    y += termLines.length * 3.5 + 4;
  }

  if (settings?.bankDetails?.bankName) {
    doc.setTextColor(154, 123, 175);
    doc.setFont('helvetica', 'bold');
    doc.text('BANK DETAILS', margin, y);
    y += 4;
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`${settings.bankDetails.bankName} | Account: ${settings.bankDetails.accountNumber || ''} | Name: ${settings.bankDetails.accountName || ''}`, margin, y);
    y += 6;
  }

  // Footer
  const footerY = 285;
  doc.setDrawColor(177, 145, 198);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(7);
  doc.text(`${settings?.companyName || 'Kukus Gallery Pvt Ltd'} | ${settings?.website || 'www.kukusgallery.com'} | ${settings?.tagline || 'Trusted Clothing Manufacturing Partners'}`, pageWidth / 2, footerY + 4, { align: 'center' });

  // Save
  doc.save(invoice.pdfFilename || `Invoice_${invoice.invoiceNumber}.pdf`);
}
