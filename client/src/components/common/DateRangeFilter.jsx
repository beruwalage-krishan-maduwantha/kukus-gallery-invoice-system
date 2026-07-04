export default function DateRangeFilter({ from, to, onFromChange, onToChange, onClear }) {
  return (
    <div className="date-range-filter" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
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
