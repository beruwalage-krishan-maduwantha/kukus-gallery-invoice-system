import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';

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

function imageWithSize(src, maxWidth, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), w: canvas.width, h: canvas.height });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function fetchJobSheetImage(orderId, kind) {
  try {
    const res = await api.get(`/orders/${orderId}/jobsheet-image/${kind}`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const image = await imageWithSize(url, 700, 0.75);
    URL.revokeObjectURL(url);
    return image;
  } catch { return null; }
}

// draws an image fitted into a box, returns the height used
function drawFittedImage(doc, image, x, y, boxWidth, maxHeight) {
  const ratio = image.h / image.w;
  let w = boxWidth;
  let h = w * ratio;
  if (h > maxHeight) { h = maxHeight; w = h / ratio; }
  try { doc.addImage(image.dataUrl, 'JPEG', x, y, w, h); } catch { return 0; }
  doc.setDrawColor(200); doc.setLineWidth(0.2); doc.rect(x, y, w, h);
  return h;
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
  doc.text('Quantity:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(order.quantity || ''), margin + 25, y);
  drawLine(doc, margin + 24, y + 1, 30);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('•', margin + 2, y);
  doc.text('Sample Size:', margin + 6, y);
  doc.setFont('helvetica', 'normal');
  if (order.jobSheet?.filled && order.jobSheet.sizeOption) {
    doc.text(order.jobSheet.sizeOption, margin + 31, y);
  }
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
  doc.setTextColor(0, 0, 0);

  const js = order.jobSheet || {};
  const isSampleSheet = order.orderType === 'Sample';

  if (js.filled) {
    // ===== FILLED JOB SHEET =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Job Sheet — ${isSampleSheet ? 'Sample' : 'Bulk'}`, margin, y);
    y += 6;

    // Images side by side
    const [designImg, materialImg] = await Promise.all([
      js.designImage?.filename ? fetchJobSheetImage(order._id, 'design') : null,
      js.materialImage?.filename ? fetchJobSheetImage(order._id, 'material') : null
    ]);
    if (designImg || materialImg) {
      const colWidth = (contentWidth - 6) / 2;
      let imgBottom = y;
      doc.setFontSize(7.5);
      if (designImg) {
        doc.setFont('helvetica', 'bold');
        doc.text('Design / Product', margin, y);
        const h = drawFittedImage(doc, designImg, margin, y + 2, colWidth, 48);
        imgBottom = Math.max(imgBottom, y + 2 + h);
      }
      if (materialImg) {
        doc.setFont('helvetica', 'bold');
        doc.text('Material', margin + colWidth + 6, y);
        const h = drawFittedImage(doc, materialImg, margin + colWidth + 6, y + 2, colWidth, 48);
        imgBottom = Math.max(imgBottom, y + 2 + h);
      }
      y = imgBottom + 8;
    }

    if (isSampleSheet) {
      if (js.sizeOption) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Size:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(js.sizeOption, margin + 12, y);
        y += 8;
      }
    } else {
      // Size breakdown table
      if (js.sizeBreakdown?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Size Break Down', margin, y);
        const totals = js.sizeBreakdown.map(r => (r.s || 0) + (r.m || 0) + (r.l || 0) + (r.xl || 0) + (r.xxl || 0));
        autoTable(doc, {
          startY: y + 2,
          head: [['Color / Material', 'S', 'M', 'L', 'XL', '2XL', 'Total']],
          body: js.sizeBreakdown.map((r, i) => [
            r.color || '-', r.s || '', r.m || '', r.l || '', r.xl || '', r.xxl || '', totals[i] || ''
          ]),
          headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 7, fontStyle: 'bold', cellPadding: 2 },
          styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 30, 30], lineColor: [0, 0, 0], lineWidth: 0.25 },
          columnStyles: { 0: { cellWidth: 40, halign: 'left' }, 6: { fontStyle: 'bold' } },
          margin: { left: margin, right: margin },
          theme: 'grid', tableLineColor: [0, 0, 0], tableLineWidth: 0.25
        });
        y = doc.lastAutoTable.finalY + 8;
      }

      // Trims with quantities
      if (js.trims?.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Trims & Accessories', margin, y);
        autoTable(doc, {
          startY: y + 2,
          head: [['Item', 'Quantity / Details']],
          body: js.trims.map(t => [t.item, t.quantity]),
          headStyles: { fillColor: [60, 60, 60], textColor: 255, fontSize: 7, fontStyle: 'bold', cellPadding: 2 },
          styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 30, 30], lineColor: [0, 0, 0], lineWidth: 0.25 },
          columnStyles: { 0: { cellWidth: 45, halign: 'left' } },
          margin: { left: margin, right: margin },
          theme: 'grid', tableLineColor: [0, 0, 0], tableLineWidth: 0.25
        });
        y = doc.lastAutoTable.finalY + 8;
      }
    }

    if (js.notes) {
      if (y > 180) { doc.addPage('a5', 'portrait'); y = 14; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('Notes', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const noteLines = doc.splitTextToSize(js.notes, contentWidth);
      doc.text(noteLines, margin, y);
    }

    return doc;
  }

  // ===== BLANK JOB SHEET (not filled yet - for handwriting) =====
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

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Fabric Details & Size Break Down', margin, y);

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
