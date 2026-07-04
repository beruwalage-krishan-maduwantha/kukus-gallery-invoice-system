import { formatDateInput } from '../../utils/formatDate';

const PRESETS = [
  {
    label: 'Today',
    getRange: () => {
      const d = new Date();
      return [d, d];
    }
  },
  {
    label: 'Yesterday',
    getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return [d, d];
    }
  },
  {
    label: 'Last 7 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return [start, end];
    }
  },
  {
    label: 'Last 30 Days',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return [start, end];
    }
  },
  {
    label: 'This Month',
    getRange: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    }
  },
  {
    label: 'Last Month',
    getRange: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)];
    }
  }
];

export default function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  const applyPreset = (label) => {
    const preset = PRESETS.find(p => p.label === label);
    if (!preset) return;
    const [start, end] = preset.getRange();
    onFromChange(formatDateInput(start));
    onToChange(formatDateInput(end));
  };

  return (
    <div className="date-range-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
      <select
        className="filter-select"
        value=""
        onChange={(e) => { if (e.target.value) applyPreset(e.target.value); }}
      >
        <option value="">Quick range...</option>
        {PRESETS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
      </select>
      <input
        type="date"
        className="filter-select"
        style={{ padding: '0.4rem 0.6rem' }}
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        title="From date"
      />
      <span style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>to</span>
      <input
        type="date"
        className="filter-select"
        style={{ padding: '0.4rem 0.6rem' }}
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        title="To date"
      />
      {(from || to) && (
        <button
          type="button"
          onClick={onClear}
          style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
