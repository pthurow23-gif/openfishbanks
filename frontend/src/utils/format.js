// Format currency: $10,000 (no decimals, with commas)
export function formatCurrency(amount) {
  return '$' + Math.round(amount).toLocaleString();
}
