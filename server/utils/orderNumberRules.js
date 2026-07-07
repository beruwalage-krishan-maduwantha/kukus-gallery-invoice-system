// Support/development items (pattern boards, size grading, main size
// development) ride along with a bulk production order: when the same
// invoice also contains a bulk item they get no order number and no Orders
// entry. Alone on an invoice, they behave like a normal order.

function itemText(item) {
  return `${item.category || ''} ${item.name || ''}`.toLowerCase();
}

function isSupportItem(item) {
  const s = itemText(item);
  return s.includes('size grading') || s.includes('pattern') || s.includes('main size');
}

function hasBulkProduction(items) {
  return items.some(i => itemText(i).includes('bulk'));
}

function skipsOrderNumber(item, items) {
  return hasBulkProduction(items) && isSupportItem(item);
}

module.exports = { isSupportItem, hasBulkProduction, skipsOrderNumber };
