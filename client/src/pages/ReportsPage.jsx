import { useState, useEffect } from 'react';
import { getReport } from '../api/reports';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import DateRangeFilter from '../components/common/DateRangeFilter';
import { formatCurrency } from '../utils/formatCurrency';

export default function ReportsPage() {
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

  const totalQuotationValue = data?.totalQuotationValue || 0;
  const ratioOfQuotation = (value) => totalQuotationValue > 0 ? `${((value / totalQuotationValue) * 100).toFixed(1)}%` : '-';

  const totalExpenseValue = data?.totalExpenses || 0;
  const ratioOfExpense = (value) => totalExpenseValue > 0 ? `${((value / totalExpenseValue) * 100).toFixed(1)}%` : '-';

  const ratioOfCount = (count, total) => total > 0 ? `${((count / total) * 100).toFixed(1)}%` : '-';

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
          <div className="table-custom">
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
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>Total</td>
                  <td style={{ textAlign: 'right' }}>{data?.totalInvoices || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(data?.totalInvoiceValue || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalInvoiceValue || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>Paid</td>
                  <td style={{ textAlign: 'right' }}>{data?.paidCount || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(data?.totalSell || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalSell || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#6366F1' }}>Advance Paid</td>
                  <td style={{ textAlign: 'right' }}>{data?.advancePaidCount || 0}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfCount(data?.advancePaidCount || 0, data?.totalInvoices || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--danger)' }}>Overdue</td>
                  <td style={{ textAlign: 'right' }}>{data?.overdueCount || 0}</td>
                  <td style={{ textAlign: 'right' }}>-</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfCount(data?.overdueCount || 0, data?.totalInvoices || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== ORDERS TAB ===== */}
      {activeTab === 'orders' && (
        <div>
          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {['Pending', 'Processing', 'Alternative', 'Delivered', 'Done'].map(status => (
                  <tr key={status}>
                    <td><StatusBadge status={status} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{oStatus[status] || 0}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfCount(oStatus[status] || 0, data?.totalOrders || 0)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(99,102,241,0.05)' }}>
                  <td style={{ fontWeight: 700, color: '#6366F1' }}>Total Orders</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#6366F1' }}>{data?.totalOrders || 0}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>100%</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>Approved</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{data?.approvedOrders || 0}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfCount(data?.approvedOrders || 0, data?.totalOrders || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: '#F59E0B' }}>Not Approved</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#F59E0B' }}>{(data?.totalOrders || 0) - (data?.approvedOrders || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfCount((data?.totalOrders || 0) - (data?.approvedOrders || 0), data?.totalOrders || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== EXPENSES TAB ===== */}
      {activeTab === 'expenses' && (
        <div>
          <div className="table-custom mb-4">
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th style={{ textAlign: 'right' }}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--danger)' }}>Total Expenses</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(data?.totalExpenses || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalExpenses || 0)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--success)' }}>Income (Paid)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(data?.totalSell || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.totalSell || 0)}</td>
                </tr>
                <tr style={{ background: (data?.profit || 0) >= 0 ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}>
                  <td style={{ fontWeight: 700, color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>Profit</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: (data?.profit || 0) >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(data?.profit || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOf(data?.profit || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {data?.expensesByCategory?.length > 0 && (
            <>
              <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary-dark)', marginBottom: '0.75rem' }}>By Category</h5>
              <div className="table-custom">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Count</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Ratio</th>
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
                        <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfExpense(cat.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== QUOTATIONS TAB ===== */}
      {activeTab === 'quotations' && (
        <div>
          <div className="table-custom">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th style={{ textAlign: 'right' }}>Ratio</th>
                </tr>
              </thead>
              <tbody>
                {['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'].map(status => (
                  <tr key={status}>
                    <td><StatusBadge status={status} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{qStatus[status]?.count || 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(qStatus[status]?.value || 0)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--accent)' }}>{ratioOfQuotation(qStatus[status]?.value || 0)}</td>
                  </tr>
                ))}
                <tr style={{ background: 'rgba(99,102,241,0.05)' }}>
                  <td style={{ fontWeight: 700, color: '#6366F1' }}>Total Quotations</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#6366F1' }}>{data?.totalQuotations || 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#6366F1' }}>{formatCurrency(data?.totalQuotationValue || 0)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--accent)' }}>100%</td>
                </tr>
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
