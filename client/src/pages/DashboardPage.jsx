import { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, CurrencyDollarIcon, ClockIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '../api/dashboard';
import StatCard from '../components/common/StatCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import RecentInvoices from '../components/dashboard/RecentInvoices';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatCard icon={DocumentTextIcon} label="Total Invoices" value={stats?.totalInvoices || 0} color="var(--primary)" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={CurrencyDollarIcon} label="Revenue" value={formatCurrency(stats?.totalRevenue || 0)} color="var(--success)" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={ClockIcon} label="Outstanding" value={formatCurrency(stats?.outstanding || 0)} color="var(--warning)" />
        </Col>
        <Col xs={6} lg={3}>
          <Link to="/credit-notes" style={{ textDecoration: 'none' }}>
            <StatCard icon={ReceiptRefundIcon} label="Credit Notes" value={`${stats?.creditCount || 0} (${formatCurrency(stats?.totalCredits || 0)})`} color="var(--info)" />
          </Link>
        </Col>
      </Row>

      <Row className="g-3 mb-4">
        <Col lg={8}>
          <RevenueChart data={stats?.weeklyRevenue || []} />
        </Col>
        <Col lg={4}>
          <StatusPieChart data={stats?.byStatus || {}} />
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>
          Recent Invoices
        </h4>
        <Link to="/invoices" className="btn-outline-custom btn-sm-custom" style={{ textDecoration: 'none' }}>View All</Link>
      </div>
      <RecentInvoices invoices={stats?.recentInvoices || []} />
    </div>
  );
}
