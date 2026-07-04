function buildOrdersFromItems({ items, invoiceId, invoiceNumber, customerId, customerSnapshot, invoiceDate, deliveryDate }) {
  const orders = [];
  for (const item of items) {
    if (!item.orderNumber) continue;
    const base = {
      invoice: invoiceId,
      invoiceNumber,
      customer: customerId,
      customerSnapshot,
      productName: item.name,
      category: item.category,
      orderType: item.orderType,
      unitPrice: item.unitPrice,
      invoiceDate: invoiceDate || new Date(),
      deliveryDate: deliveryDate || undefined,
      status: 'Pending'
    };

    if (item.orderType === 'Sample' && item.quantity > 1) {
      for (let i = 1; i <= item.quantity; i++) {
        orders.push({ ...base, orderNumber: `${item.orderNumber}-${i}`, quantity: 1 });
      }
    } else {
      orders.push({ ...base, orderNumber: item.orderNumber, quantity: item.quantity });
    }
  }
  return orders;
}

module.exports = buildOrdersFromItems;
