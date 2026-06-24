import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getInvoices, deleteInvoice, updateInvoiceStatus } from '../api/invoices';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { STATUS_OPTIONS } from '../utils/constants';

export default function InvoiceListPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ search, status: statusFilter || undefined, page, limit: 20 });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateInvoiceStatus(id, status);
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteTarget._id);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoices..." />
          <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} invoices</span>
        </div>
        <Link to="/invoices/new">
          <Button className="btn-primary-custom">
            <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Invoice
          </Button>
        </Link>
      </div>

      {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
        <EmptyState
          icon={DocumentTextIcon}
          title="No invoices yet"
          message="Create your first invoice to get started."
          action={<Link to="/invoices/new"><Button className="btn-primary-custom mt-3">Create Invoice</Button></Link>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Delivery</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} onClick={() => navigate(`/invoices/${inv._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                  <td>{inv.customerSnapshot?.name || inv.customer?.name}</td>
                  <td>{formatDate(inv.invoiceDate)}</td>
                  <td>{formatDate(inv.deliveryDate)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(inv.grandTotal)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1 flex-wrap">
                      {inv.status === 'Draft' && (
                        <>
                          <button className="btn-outline-custom btn-sm-custom" onClick={() => navigate(`/invoices/${inv._id}/edit`)}>Edit</button>
                          <button className="btn-sm-custom" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStatusChange(inv._id, 'Sent')}>Send</button>
                        </>
                      )}
                      {inv.status === 'Sent' && (
                        <button className="btn-sm-custom" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStatusChange(inv._id, 'Paid')}>Paid</button>
                      )}
                      {inv.status === 'Draft' && (
                        <button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setDeleteTarget(inv)}>Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete invoice ${deleteTarget?.invoiceNumber}? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
