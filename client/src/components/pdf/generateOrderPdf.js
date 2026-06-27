import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function fmtDate(date) {
  if (!date) return '';
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

function drawLine(doc, x, y, width) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + width, y);
}

function drawCheckbox(doc, x, y, checked) {
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(x, y - 2.5, 3, 3);
  if (checked) {
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(x + 0.5, y - 0.8, x + 1.2, y + 0.2);
    doc.line(x + 1.2, y + 0.2, x + 2.7, y - 2);
  }
}

async function buildOrderPdf(order) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageWidth = 148;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const lineFieldWidth = contentWidth - 40;

  let logoBase64 = null;
  try { logoBase64 = await compressImage('/logo.png', 200, 0.6); } catch {}

  // ========== PAGE 1 ==========

  // Watermark
  if (logoBase64) {
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - 35, 85, 70, 51);
      doc.restoreGraphicsState();
    } catch {}
  }

  // Header
  let y = 14;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('KUKUS GALLERY PVT LTD', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('484/8F WETTASINGHE GARDENS PITA KOTTE', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(6.5);
  doc.text('077 698 6155 | 076 861 4050 | 0112 870 057', pageWidth / 2, y, { align: 'center' });

  // Date
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(fmtDate(order.invoiceDate || new Date()), margin + 15, y);
  drawLine(doc, margin + 14, y + 1, 40);

  // Order Number badge (top right)
  const badgeText = order.orderNumber;
  doc.setFillColor(177, 145, 198);
  doc.roundedRect(pageWidth - margin - 30, y - 5, 30, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(badgeText, pageWidth - margin - 15, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Client Information
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Client Information', margin, y);

  y += 7;
  doc.setFontSize(7.5);
  doc.text('•', margin + 2, y);
  doc.text('Client Name:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  const clientName = `${order.customerSnapshot?.title ? order.customerSnapshot.title + '. ' : ''}${order.customerSnapshot?.name || ''}`;
  doc.text(clientName, margin + 35, y);
  drawLine(doc, margin + 34, y + 1, lineFieldWidth - 20);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Company Name (if applicable):', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 58, y + 1, lineFieldWidth - 44);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Contact Number:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerSnapshot?.phone || '', margin + 38, y);
  drawLine(doc, margin + 37, y + 1, lineFieldWidth - 23);

  // Order Information
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Order Information', margin, y);

  y += 7;
  doc.setFontSize(7.5);
  doc.text('•', margin + 2, y);
  doc.text('Order Type:', margin + 6, y);
  const isSample = order.orderType === 'Sample';
  drawCheckbox(doc, margin + 32, y, isSample);
  doc.setFont('helvetica', 'normal');
  doc.text('Sample', margin + 36, y);
  drawCheckbox(doc, margin + 52, y, !isSample);
  doc.text('Bulk', margin + 56, y);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Design Number / Style Code:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 55, y + 1, lineFieldWidth - 41);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Product:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(order.productName || '', margin + 25, y);
  drawLine(doc, margin + 24, y + 1, lineFieldWidth - 10);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Quantity:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(order.quantity || ''), margin + 25, y);
  drawLine(doc, margin + 24, y + 1, 30);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Sample Size:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 30, y + 1, lineFieldWidth - 16);

  // Received By
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Received By', margin, y);

  y += 7;
  doc.setFontSize(7.5);
  doc.text('•', margin + 2, y);
  doc.text('Received By:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 30, y + 1, lineFieldWidth - 16);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Signature:', margin + 6, y);
  drawLine(doc, margin + 26, y + 1, 30);
  doc.text('Date:', margin + 62, y);
  drawLine(doc, margin + 74, y + 1, lineFieldWidth - 60);

  // Client Confirmation
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Client Confirmation', margin, y);

  y += 7;
  doc.setFontSize(7.5);
  doc.text('•', margin + 2, y);
  doc.text('Client Signature:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 36, y + 1, lineFieldWidth - 22);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Date:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  drawLine(doc, margin + 18, y + 1, 40);

  // ========== PAGE 2 ==========
  doc.addPage('a5', 'portrait');

  // Watermark on page 2
  if (logoBase64) {
    try {
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.05 }));
      doc.addImage(logoBase64, 'JPEG', pageWidth / 2 - 35, 85, 70, 51);
      doc.restoreGraphicsState();
    } catch {}
  }

  y = 14;

  // Trims & Accessories
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Trims & Accessories', margin, y);

  y += 3;
  const trimsItems = ['Label', 'Hang Tag', 'Button', 'Zipper', 'Thread', 'Elastic', 'Other'];

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Quantity']],
    body: trimsItems.map(item => [item, '']),
    headStyles: {
      fillColor: [60, 60, 60], textColor: 255,
      fontSize: 7.5, fontStyle: 'bold', cellPadding: 3
    },
    styles: {
      fontSize: 7.5, cellPadding: 3.5,
      textColor: [30, 30, 30],
      lineColor: [0, 0, 0], lineWidth: 0.3,
      minCellHeight: 8
    },
    columnStyles: {
      0: { cellWidth: 50, halign: 'left' },
      1: { cellWidth: 'auto', halign: 'left' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.3
  });

  y = doc.lastAutoTable.finalY + 10;

  // Fabric Details & Size Break Down
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Fabric Details & Size Break Down', margin, y);

  y += 4;

  // Empty table for fabric details
  autoTable(doc, {
    startY: y,
    head: [['Fabric Type', 'Color', 'S', 'M', 'L', 'XL', 'XXL', 'Total']],
    body: [
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '']
    ],
    headStyles: {
      fillColor: [60, 60, 60], textColor: 255,
      fontSize: 6.5, fontStyle: 'bold', cellPadding: 2.5
    },
    styles: {
      fontSize: 6.5, cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [0, 0, 0], lineWidth: 0.3,
      minCellHeight: 8
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 22 },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    theme: 'grid',
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.3
  });

  y = doc.lastAutoTable.finalY + 10;

  // Special Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Special Instructions / Notes', margin, y);
  y += 3;
  drawLine(doc, margin, y + 3, contentWidth);
  drawLine(doc, margin, y + 10, contentWidth);
  drawLine(doc, margin, y + 17, contentWidth);

  return doc;
}

export async function generateOrderPdf(order) {
  const doc = await buildOrderPdf(order);
  const fileName = `${order.orderNumber}_${(order.customerSnapshot?.name || 'Order').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(fileName);
}

export async function previewOrderPdf(order) {
  const doc = await buildOrderPdf(order);
  return doc.output('bloburl');
}
