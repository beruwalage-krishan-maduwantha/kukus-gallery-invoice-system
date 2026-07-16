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

    // Previously, Sample orders with quantity > 1 were split into one order
    // per unit (SM021-1, SM021-2, ...) because a job sheet could only hold
    // one design. The job sheet now supports multiple "Design" blocks per
    // order, so a single order covers the whole quantity.
    orders.push({ ...base, orderNumber: item.orderNumber, quantity: item.quantity });
  }
  return orders;
}

module.exports = buildOrdersFromItems;
