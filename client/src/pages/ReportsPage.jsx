import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { getReport } from '../api/reports';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import DateRangeFilter from '../components/common/DateRangeFilter';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function ReportsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    getReport({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  if (loading && !data) return <LoadingSpinner />;

  const qStatus = data?.quotationByStatus || {};

  const oStatus = data?.ordersByStatus || {};

  const totalInvoiceValue = data?.totalInvoiceValue || 0;
  const ratioOf = (value) => totalInvoiceValue > 0 ? `${((value / totalInvoiceValue) * 100).toFixed(1)}%` : '-';

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'orders', label: 'Orders' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'quotations', label: 'Quotations' },
    { key: 'sales', label: 'Sales Conversion' }
  ];

  return (
    <div>
      <div className="action-bar" style={{ marginBottom: '1rem' }}>
        <div className="action-bar-left">
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
          />
        </div>
      </div>

      <div className="service-tabs" style={{ marginBottom: '1.5rem' }}>
        {tabs.map(t => (
          <button key={t.key} className={`service-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ===== SUMMARY TAB ===== */}
      {activeTab === 'summary' && (
        <div>
          <div className="table-custom mb-4">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th style={{ textAlign: 'right' }}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Total Invoices</td>
                  <td style={{ textAlign: 'right' }}>{data?.totalInvoices || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data?.totalInvoiceValue || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalInvoiceValue || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Total Quotations</td>
                  <td style={{ textAlign: 'right' }}>{data?.totalQuotations || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data?.totalQuotationValue || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalQuotationValue || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>Total Income</td>
                  <td style={{ textAlign: 'right' }}>{data?.paidCount || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(data?.totalSell || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalSell || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#6366F1' }}>Converted Quotations</td>
                  <td style={{ textAlign: 'right' }}>{data?.convertedCount || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#6366F1' }}>{formatCurrency(data?.totalConvertedValue || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalConvertedValue || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--info)' }}>Conversion Rate</td>
                  <td style={{ textAlign: 'right' }}>{data?.totalQuotations || 0} quotations</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: 'var(--info)' }}>{data?.conversionRate || 0}%</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>-</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#6366F1' }}>Total Orders</td>
                  <td style={{ textAlign: 'right' }}>{data?.totalOrders || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#6366F1' }}>{data?.approvedOrders || 0} approved</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>-</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--danger)' }}>Total Expenses</td>
                  <td style={{ textAlign: 'right' }}>{data?.expenses?.length || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(data?.totalExpenses || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalExpenses || 0)}</td>
                </tr>
                <tr style={{ background: (data?.profit || 0) >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}>
                  <td style={{ fontWeight: 700, fontSize: '1rem', color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>Profit</td>
                  <td style={{ textAlign: 'right' }}>Income - Expenses</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(data?.profit || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.profit || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>Total Finished Orders</td>
                  <td style={{ textAlign: 'right' }}>{oStatus['Done'] || 0}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{(data?.totalOrders || 0) > 0 ? `${(((oStatus['Done'] || 0) / data.totalOrders) * 100).toFixed(1)}%` : '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== INVOICES TAB ===== */}
      {activeTab === 'invoices' && (
        <div>
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Total</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{data?.totalInvoices || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{formatCurrency(data?.totalInvoiceValue || 0)}</div>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--success)' }}>Paid</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{data?.paidCount || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>{formatCurrency(data?.totalSell || 0)}</div>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6366F1' }}>Advance Paid</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: '#6366F1' }}>{data?.advancePaidCount || 0}</div>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--danger)' }}>Overdue</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>{data?.overdueCount || 0}</div>
              </div>
            </Col>
          </Row>

          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Advance</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.invoices || data.invoices.length === 0) ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No invoices</td></tr>
                ) : data.invoices.map(inv => (
                  <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                    <td>{inv.customerSnapshot?.title ? `${inv.customerSnapshot.title}. ` : ''}{inv.customerSnapshot?.name}</td>
                    <td>{formatDate(inv.invoiceDate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(inv.grandTotal)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(inv.advancePayment || 0)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(inv.balance || 0)}</td>
                    <td><StatusBadge status={inv.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== ORDERS TAB ===== */}
      {activeTab === 'orders' && (
        <div>
          <Row className="g-3 mb-4">
            {['Pending', 'Processing', 'Alternative', 'Delivered', 'Done'].map(status => (
              <Col xs={6} md={2} key={status}>
                <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                  <StatusBadge status={status} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.3rem' }}>{oStatus[status] || 0}</div>
                </div>
              </Col>
            ))}
          </Row>

          <Row className="g-3 mb-4">
            <Col xs={6} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>Total Orders</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{data?.totalOrders || 0}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--success)' }}>Approved</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{data?.approvedOrders || 0}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#F59E0B' }}>Not Approved</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: '#F59E0B' }}>{(data?.totalOrders || 0) - (data?.approvedOrders || 0)}</div>
              </div>
            </Col>
          </Row>

          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Invoice</th>
                  <th>Invoice Date</th>
                  <th>Delivery Date</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.orders || data.orders.length === 0) ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No orders</td></tr>
                ) : data.orders.map(o => (
                  <tr key={o._id}>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: o.orderType === 'Sample' ? 'var(--primary)' : 'var(--info)', background: o.orderType === 'Sample' ? 'rgba(177,145,198,0.12)' : 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                        {o.orderNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{o.productName}</td>
                    <td>{o.customerSnapshot?.title ? `${o.customerSnapshot.title}. ` : ''}{o.customerSnapshot?.name}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/invoices/${o.invoice}`)}>
                        {o.invoiceNumber}
                      </span>
                    </td>
                    <td>{formatDate(o.invoiceDate)}</td>
                    <td>{o.deliveryDate ? formatDate(o.deliveryDate) : <span style={{ color: '#ccc' }}>—</span>}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{o.quantity}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td>
                      {o.approved ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '0.72rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(34,197,94,0.1)', padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                          <CheckCircleIcon style={{ width: 13, height: 13 }} /> Approved
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 600 }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== EXPENSES TAB ===== */}
      {activeTab === 'expenses' && (
        <div>
          <Row className="g-3 mb-4">
            <Col xs={6} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--danger)' }}>Total Expenses</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(data?.totalExpenses || 0)}</div>
              </div>
            </Col>
            <Col xs={6} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--success)' }}>Income (Paid)</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(data?.totalSell || 0)}</div>
              </div>
            </Col>
            <Col xs={12} md={4}>
              <div className="card-custom" style={{ textAlign: 'center', padding: '1rem', background: (data?.profit || 0) >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>Profit</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(data?.profit || 0)}</div>
              </div>
            </Col>
          </Row>

          {data?.expensesByCategory?.length > 0 && (
            <>
              <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>By Category</h5>
              <div className="table-custom mb-4">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Count</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expensesByCategory.map(cat => (
                      <tr key={cat._id}>
                        <td>
                          <span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>{cat._id}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{cat.count}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(cat.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>All Expenses</h5>
          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.expenses || data.expenses.length === 0) ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No expenses</td></tr>
                ) : data.expenses.map(exp => (
                  <tr key={exp._id}>
                    <td>{formatDate(exp.date)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{exp.title}</td>
                    <td><span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>{exp.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                    <td style={{ fontSize: '0.82rem', color: '#666' }}>{exp.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== QUOTATIONS TAB ===== */}
      {activeTab === 'quotations' && (
        <div>
          <Row className="g-3 mb-4">
            {['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'].map(status => (
              <Col xs={6} md key={status}>
                <div className="card-custom" style={{ textAlign: 'center', padding: '0.75rem' }}>
                  <StatusBadge status={status} />
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-dark)', marginTop: '0.3rem' }}>{qStatus[status]?.count || 0}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--accent)' }}>{formatCurrency(qStatus[status]?.value || 0)}</div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Valid Until</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {(!data?.quotations || data.quotations.length === 0) ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No quotations</td></tr>
                ) : data.quotations.map(q => (
                  <tr key={q._id} onClick={() => navigate(`/quotations/${q._id}`)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{q.quotationNumber}</td>
                    <td>{q.customerSnapshot?.name}</td>
                    <td>{formatDate(q.quotationDate)}</td>
                    <td>{formatDate(q.validUntil)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(q.grandTotal)}</td>
                    <td><StatusBadge status={q.status} /></td>
                    <td>
                      {q.convertedInvoice ? (
                        <span style={{ fontSize: '0.75rem', color: '#6366F1', fontWeight: 600, cursor: 'pointer' }} onClick={e => { e.stopPropagation(); navigate(`/invoices/${q.convertedInvoice._id || q.convertedInvoice}`); }}>
                          {q.convertedInvoice.invoiceNumber || 'View'}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== SALES CONVERSION TAB ===== */}
      {activeTab === 'sales' && (
        <div>
          <div className="table-custom mb-4">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Total Quotations Created</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{data?.totalQuotations || 0}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Total Quotation Value</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data?.totalQuotationValue || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#6366F1' }}>Converted to Invoice</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#6366F1' }}>{data?.convertedCount || 0}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#6366F1' }}>Converted Value</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#6366F1' }}>{formatCurrency(data?.totalConvertedValue || 0)}</td>
                </tr>
                <tr style={{ background: 'rgba(59,130,246,0.05)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--info)', fontSize: '1rem' }}>Conversion Rate</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--info)', fontSize: '1.2rem' }}>{data?.conversionRate || 0}%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Total Invoices</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{data?.totalInvoices || 0}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Total Invoice Value</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data?.totalInvoiceValue || 0)}</td>
                </tr>
                <tr style={{ background: 'rgba(34,197,94,0.05)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1rem' }}>Total Sell (Paid Invoices)</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '1.2rem' }}>{formatCurrency(data?.totalSell || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
