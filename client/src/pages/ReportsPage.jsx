import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import {
  DocumentDuplicateIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  BanknotesIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { getReport } from '../api/reports';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReport()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const qStatus = data?.quotationByStatus || {};

  return (
    <div>
      {/* Summary Cards */}
      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
        Overview
      </h4>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3} onClick={() => navigate('/quotations')} style={{ cursor: 'pointer' }}>
          <StatCard icon={DocumentDuplicateIcon} label="Total Quotations" value={data?.totalQuotations || 0} color="var(--primary)" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={BanknotesIcon} label="Total Quotation Value" value={formatCurrency(data?.totalQuotationValue || 0)} color="var(--accent)" />
        </Col>
        <Col xs={6} lg={3} onClick={() => navigate('/invoices')} style={{ cursor: 'pointer' }}>
          <StatCard icon={DocumentTextIcon} label="Total Invoices" value={data?.totalInvoices || 0} color="var(--info)" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={BanknotesIcon} label="Total Invoice Value" value={formatCurrency(data?.totalInvoiceValue || 0)} color="var(--warning)" />
        </Col>
      </Row>

      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
        Sales Conversion
      </h4>
      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <StatCard icon={ArrowPathIcon} label="Converted to Sell" value={data?.convertedCount || 0} color="#6366F1" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={BanknotesIcon} label="Converted Value" value={formatCurrency(data?.totalConvertedValue || 0)} color="#6366F1" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={ChartBarIcon} label="Conversion Rate" value={`${data?.conversionRate || 0}%`} color="var(--success)" />
        </Col>
        <Col xs={6} lg={3}>
          <StatCard icon={CheckCircleIcon} label="Total Sell (Paid)" value={formatCurrency(data?.totalSell || 0)} color="var(--success)" />
        </Col>
      </Row>

      {/* Quotation Status Breakdown */}
      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
        Quotation Status Breakdown
      </h4>
      <Row className="g-3 mb-4">
        {['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Converted'].map(status => (
          <Col xs={6} md={4} lg={2} key={status}>
            <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
              <StatusBadge status={status} />
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.5rem' }}>
                {qStatus[status]?.count || 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
                {formatCurrency(qStatus[status]?.value || 0)}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* All Quotations Table */}
      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '1rem' }}>
        All Quotations
      </h4>
      <div className="table-custom">
        <table>
          <thead>
            <tr>
              <th>Quotation #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Valid Until</th>
              <th>Value</th>
              <th>Status</th>
              <th>Converted Invoice</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.quotations || data.quotations.length === 0) ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No quotations yet</td></tr>
            ) : (
              data.quotations.map(q => (
                <tr key={q._id} onClick={() => navigate(`/quotations/${q._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{q.quotationNumber}</td>
                  <td>{q.customerSnapshot?.name}</td>
                  <td>{formatDate(q.quotationDate)}</td>
                  <td>{formatDate(q.validUntil)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(q.grandTotal)}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td>
                    {q.status === 'Converted' && q.convertedInvoice ? (
                      <button
                        className="btn-sm-custom"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'none', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${q.convertedInvoice._id || q.convertedInvoice}`); }}
                      >
                        {q.convertedInvoice.invoiceNumber || 'View Invoice'}
                      </button>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
