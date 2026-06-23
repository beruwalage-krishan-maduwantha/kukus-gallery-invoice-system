import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export default function RecentInvoices({ invoices = [] }) {
  const navigate = useNavigate();

  return (
    <div className="table-custom">
      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Customer</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>No invoices yet</td></tr>
          ) : (
            invoices.map(inv => (
              <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)}>
                <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                <td>{inv.customerSnapshot?.name}</td>
                <td>{formatDate(inv.invoiceDate)}</td>
                <td>{formatCurrency(inv.grandTotal)}</td>
                <td><StatusBadge status={inv.status} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
