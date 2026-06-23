import { STATUS_COLORS } from '../../utils/constants';

export default function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#f0f0f0', color: '#666' };
  return (
    <span className="status-badge" style={{ background: colors.bg, color: colors.color }}>
      {status}
    </span>
  );
}
