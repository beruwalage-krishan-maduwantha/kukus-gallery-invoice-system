import { STATUS_COLORS } from '../../utils/constants';
import { BRAND } from '../../brand';

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#f0f0f0', color: 'var(--muted-ink)' };
  return (
    <span className="status-badge" style={{ background: colors.bg, color: colors.color }}>
      {BRAND.statusLabels[status] || status}
    </span>
  );
}
