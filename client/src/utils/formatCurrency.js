export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `LKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
