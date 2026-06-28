import { useState, useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, CurrencyDollarIcon, ClockIcon, ReceiptRefundIcon, ClipboardDocumentListIcon, BanknotesIcon } from '@heroicons/react/24/outline';
import { getDashboardStats } from '../api/dashboard';
import StatCard from '../components/common/StatCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import StatusPieChart from '../components/dashboard/StatusPieChart';
import RecentInvoices from '../components/dashboard/RecentInvoices';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

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
          <StatCard icon={CurrencyDollarIcon} label="Revenue" value={formatCurrency(stats?.totalRevenue || 0)} color="var(--success)" />
        </Col>
        <Col xs={6} lg={3}>
          <Link to="/expenses" style={{ textDecoration: 'none' }}>
            <StatCard icon={BanknotesIcon} label="Expenses" value={formatCurrency(stats?.totalExpenses || 0)} color="var(--danger)" />
          </Link>
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={CurrencyDollarIcon} label="Profit" value={formatCurrency(stats?.profit || 0)} color={(stats?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)'} />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={ClockIcon} label="Outstanding" value={formatCurrency(stats?.outstanding || 0)} color="var(--warning)" />
        </Col>
      </Row>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatCard icon={DocumentTextIcon} label="Total Invoices" value={stats?.totalInvoices || 0} color="var(--primary)" />
        </Col>
        <Col xs={6} lg={3}>
          <Link to="/orders" style={{ textDecoration: 'none' }}>
            <StatCard icon={ClipboardDocumentListIcon} label="Orders" value={`${stats?.totalOrders || 0} (${stats?.pendingOrders || 0} pending)`} color="#6366F1" />
          </Link>
        </Col>
        <Col xs={6} lg={3}>
          <Link to="/credit-notes" style={{ textDecoration: 'none' }}>
            <StatCard icon={ReceiptRefundIcon} label="Credit Notes" value={`${stats?.creditCount || 0}`} color="var(--info)" />
          </Link>
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={BanknotesIcon} label="This Month Expenses" value={formatCurrency(stats?.thisMonthExpenses || 0)} color="#D97706" />
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

      <Row className="g-4 mb-4">
        <Col lg={6}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>
              Recent Invoices
            </h4>
            <Link to="/invoices" className="btn-outline-custom btn-sm-custom" style={{ textDecoration: 'none' }}>View All</Link>
          </div>
          <RecentInvoices invoices={stats?.recentInvoices || []} />
        </Col>
        <Col lg={6}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', margin: 0 }}>
              Recent Orders
            </h4>
            <Link to="/orders" className="btn-outline-custom btn-sm-custom" style={{ textDecoration: 'none' }}>View All</Link>
          </div>
          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No orders yet</td></tr>
                ) : stats.recentOrders.map(o => (
                  <tr key={o._id} onClick={() => window.location.href = `/orders`} style={{ cursor: 'pointer' }}>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: o.orderType === 'Sample' ? 'var(--primary)' : 'var(--info)', background: o.orderType === 'Sample' ? 'rgba(177,145,198,0.12)' : 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                        {o.orderNumber}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{o.productName}</td>
                    <td style={{ fontSize: '0.82rem' }}>{o.customerSnapshot?.name}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>
    </div>
  );
}
