import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

export default function RevenueChart({ data = [] }) {
  const chartData = {
    labels: data.map(d => d.week),
    datasets: [{
      label: 'Revenue (LKR)',
      data: data.map(d => d.total),
      backgroundColor: '#B191C6',
      borderRadius: 6,
      maxBarThickness: 50
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        ticks: { font: { family: 'Montserrat', size: 11 }, callback: v => `${(v / 1000).toFixed(0)}k` },
        grid: { color: 'rgba(177,145,198,0.08)' }
      },
      x: {
        ticks: { font: { family: 'Montserrat', size: 11 } },
        grid: { display: false }
      }
    }
  };

  return (
    <div className="chart-card">
      <h4 className="chart-title">This Month Revenue</h4>
      <div style={{ height: 280 }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
