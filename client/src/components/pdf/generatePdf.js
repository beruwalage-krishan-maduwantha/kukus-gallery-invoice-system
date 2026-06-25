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

function drawFooter(doc, pageWidth, pageHeight, margin, settings) {
  doc.setDrawColor(177, 145, 198);
  doc.setLineWidth(0.2);
  doc.line(margin, pageHeight - 6, pageWidth - margin, pageHeight - 6);
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(4.5);
  doc.text(`${settings?.companyName || 'Kukus Gallery Pvt Ltd'} | ${settings?.website || 'www.kukusgallery.com'}`, pageWidth / 2, pageHeight - 3, { align: 'center' });
}

function drawInvoiceContent(doc, data, settings, logoBase64, title) {
  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 8;
  const contentWidth = pageWidth - margin * 2;

  // Header bar
  doc.setFillColor(44, 22, 64);
  doc.rect(0, 0, pageWidth, 35, 'F');

  if (logoBase64) {
    try { doc.addImage(logoBase64, 'JPEG', margin, 2, 28, 30); } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(settings?.companyName || 'Kukus Gallery Pvt Ltd', pageWidth - margin, 10, { align: 'right' });
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.address || '', pageWidth - margin, 15, { align: 'right' });
  doc.text(`Tel: ${settings?.landline || '011 287 0057'}`, pageWidth - margin, 19, { align: 'right' });
  doc.text(`Email: ${settings?.email || ''}`, pageWidth - margin, 23, { align: 'right' });
  if (settings?.website) doc.text(`Web: ${settings.website}`, pageWidth - margin, 27, { align: 'right' });

  // Title
  let y = 40;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);

  doc.setFontSize(9);
  doc.setTextColor(177, 145, 198);
  doc.text(data.invoiceNumber || data.quotationNumber, margin + (title.length * 4.5), y);

  // Invoice meta - right aligned table
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  const metaX = pageWidth - margin - 40;
  doc.setTextColor(120, 120, 120);
  doc.text('Date', metaX, y - 4);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(fmtDate(data.invoiceDate || data.quotationDate), pageWidth - margin, y - 4, { align: 'right' });

  if (data.deliveryDate) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Delivery', metaX, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtDate(data.deliveryDate), pageWidth - margin, y, { align: 'right' });
  }
  if (data.validUntil) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Valid Until', metaX, y);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(fmtDate(data.validUntil), pageWidth - margin, y, { align: 'right' });
  }
  if (data.paymentType) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('Payment', metaX, y + 4);
    doc.setTextColor(30, 30, 30);
    doc.text(data.paymentType, pageWidth - margin, y + 4, { align: 'right' });
  }

  // Divider
  y += 8;
  doc.setDrawColor(212, 189, 227);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  // Bill To
  const snap = data.customerSnapshot || {};
  y += 4;
  doc.setTextColor(154, 123, 175);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  y += 3.5;
  doc.setTextColor(44, 22, 64);
  doc.setFontSize(8);
  doc.text(`${snap.title ? snap.title + '. ' : ''}${snap.name || ''}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  y += 3.5;
  if (snap.address) { doc.text(snap.address, margin, y); y += 3; }
  if (snap.phone) { doc.text(`Phone: ${snap.phone}`, margin, y); y += 3; }
  if (snap.email) { doc.text(`Email: ${snap.email}`, margin, y); y += 3; }
  y += 2;

  // Items table - NO type column
  const tableBody = data.items.map((item, i) => [
    i + 1, item.name, item.quantity,
    formatLKR(item.unitPrice), item.discount > 0 ? `${item.discount}%` : '-', formatLKR(item.lineTotal)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Product / Service', 'Qty', 'Unit Price', 'Disc', 'Total']],
    body: tableBody,
    headStyles: { fillColor: [44, 22, 64], textColor: 255, fontSize: 5.5, fontStyle: 'bold', cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [248, 244, 251] },
    styles: { fontSize: 6, cellPadding: 1.5, textColor: [30, 30, 30], lineColor: [230, 230, 230], lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },
      2: { cellWidth: 10, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 24, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }, theme: 'grid'
  });

  y = doc.lastAutoTable.finalY + 4;

  // Totals
  const summaryX = pageWidth - margin - 55;
  doc.setFontSize(6.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(30, 30, 30);
  doc.text(formatLKR(data.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 4;

  if (data.discountAmount > 0) {
    doc.setTextColor(239, 68, 68);
    doc.text(`Discount ${data.discountType === 'percentage' ? `(${data.discountValue}%)` : ''}:`, summaryX, y);
    doc.text(`- ${formatLKR(data.discountAmount)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }

  // Advance if exists
  const advance = Number(data.advancePayment) || 0;
  if (advance > 0) {
    doc.setTextColor(34, 197, 94);
    doc.setFont('helvetica', 'normal');
    doc.text('Advance:', summaryX, y);
    doc.text(`- ${formatLKR(advance)}`, pageWidth - margin, y, { align: 'right' });
    y += 4;
  }

  // Grand Total bar
  const finalTotal = advance > 0 ? (data.grandTotal - advance) : data.grandTotal;
  y += 1;
  doc.setFillColor(177, 145, 198);
  doc.roundedRect(summaryX - 3, y - 3, contentWidth - summaryX + margin + 3, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX, y + 2);
  doc.text(formatLKR(finalTotal), pageWidth - margin, y + 2, { align: 'right' });

  if (false) { // removed old advance/balance block
  }

  // Bank details
  y += 12;
  if (settings?.bankDetails?.bankName) {
    doc.setFillColor(44, 22, 64);
    doc.roundedRect(margin, y - 3, contentWidth, 18, 2, 2, 'F');
    doc.setTextColor(212, 189, 227);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('PAY TO:', margin + 4, y + 1);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank - ${settings.bankDetails.bankName}`, margin + 4, y + 5);
    doc.text(`Account Name - ${settings.bankDetails.accountName || ''}`, margin + 4, y + 9);
    doc.text(`Account Number - ${settings.bankDetails.accountNumber || ''}`, margin + 4, y + 13);
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
  doc.setTextColor(44, 22, 64);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Terms & Conditions', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  const termsLines = doc.splitTextToSize(TERMS_TEXT, contentWidth);
  const lineHeight = 2.4;
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

export async function generateInvoicePdf(invoice, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  let logoBase64 = null;
  try { logoBase64 = await compressImage('/logo.png', 200, 0.6); } catch {}

  drawInvoiceContent(doc, invoice, settings, logoBase64, 'INVOICE');
  drawTermsPage(doc, settings);

  doc.save(invoice.pdfFilename || `Invoice_${invoice.invoiceNumber}.pdf`);
}

export async function generateQuotationPdf(quotation, settings) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  let logoBase64 = null;
  try { logoBase64 = await compressImage('/logo.png', 200, 0.6); } catch {}

  drawInvoiceContent(doc, quotation, settings, logoBase64, 'QUOTATION');
  drawTermsPage(doc, settings);

  doc.save(quotation.pdfFilename || `Quotation_${quotation.quotationNumber}.pdf`);
}
