export default function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ background: `${color}15`, color }}>
        <Icon style={{ width: 24, height: 24 }} />
      </div>
      <div>
        <p className="stat-card-label">{label}</p>
        <h3 className="stat-card-value">{value}</h3>
      </div>
    </div>
  );
}
