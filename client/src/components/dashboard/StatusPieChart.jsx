import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const STATUS_MAP = {
  Draft: '#9A7BAF',
  Sent: '#3B82F6',
  Paid: '#22C55E',
  Overdue: '#EF4444',
  Cancelled: '#94A3B8'
};

export default function StatusPieChart({ data = {} }) {
  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: labels.map(l => STATUS_MAP[l] || '#ccc'),
      borderWidth: 0
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { family: 'Montserrat', size: 11 }, padding: 16, usePointStyle: true, pointStyleWidth: 10 }
      }
    }
  };

  return (
    <div className="chart-card">
      <h4 className="chart-title">Invoice Status</h4>
      <div style={{ height: 280 }}>
        {labels.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <p style={{ textAlign: 'center', color: '#999', paddingTop: '5rem' }}>No data yet</p>
        )}
      </div>
    </div>
  );
}
