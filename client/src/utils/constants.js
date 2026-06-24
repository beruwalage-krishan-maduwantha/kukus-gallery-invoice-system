export const STATUS_OPTIONS = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

export const ORDER_TYPES = ['Sample', 'Bulk'];

export const PAYMENT_TYPES = ['Bank Transfer', 'Cash', 'Credits'];

export const SERVICE_TYPES = ['Design Wear', 'Corporate Clothing'];

export const CATEGORIES = {
  'Design Wear': ['Main Size Development', 'Size Grading', 'Sample Development', 'Bulk Production'],
  'Corporate Clothing': ['T-Shirts', 'Uniforms', 'DTF Printing', 'Embroidery']
};

export const ALL_CATEGORIES = [
  'Main Size Development', 'Size Grading', 'Sample Development',
  'Bulk Production',
  'T-Shirts', 'Uniforms', 'DTF Printing', 'Embroidery', 'Other'
];

export const UNITS = ['piece', 'meter', 'yard', 'set', 'hour', 'lot'];

export const STATUS_COLORS = {
  Draft: { bg: 'rgba(154,123,175,0.12)', color: '#9A7BAF' },
  Sent: { bg: 'rgba(59,130,246,0.1)', color: '#3B82F6' },
  Paid: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
  Overdue: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
  Cancelled: { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8' },
  Accepted: { bg: 'rgba(34,197,94,0.1)', color: '#22C55E' },
  Rejected: { bg: 'rgba(239,68,68,0.1)', color: '#EF4444' },
  Expired: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  Converted: { bg: 'rgba(99,102,241,0.1)', color: '#6366F1' }
};

export const QUOTATION_STATUS_OPTIONS = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'];
