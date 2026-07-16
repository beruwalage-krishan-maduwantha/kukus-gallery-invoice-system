import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Modal, Form } from 'react-bootstrap';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getInvoices, deleteInvoice, updateInvoiceStatus } from '../api/invoices';
import { getSettings } from '../api/settings';
import { printInvoicePdf } from '../components/pdf/generatePdf';
import api from '../api/axios';
import SearchInput from '../components/common/SearchInput';
import DateRangeFilter from '../components/common/DateRangeFilter';
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [payingAdvance, setPayingAdvance] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ search, status: statusFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, limit: 20 });
      setInvoices(res.data.invoices);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [search, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateInvoiceStatus(id, status);
      toast.success(`Invoice marked as ${status}`);
      fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAdvancePay = async () => {
    if (payingAdvance) return;
    if (!advanceAmount || Number(advanceAmount) <= 0) return toast.error('Enter a valid amount');
    setPayingAdvance(true);
    try {
      await api.post(`/invoices/${advanceTarget._id}/advance`, { amount: Number(advanceAmount) });
      toast.success('Advance payment recorded');
      setAdvanceTarget(null);
      setAdvanceAmount('');
      fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPayingAdvance(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(deleteTarget._id);
      toast.success('Invoice deleted');
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' });

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search invoices..." />
          <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={v => { setDateFrom(v); setPage(1); }}
            onToChange={v => { setDateTo(v); setPage(1); }}
            onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} invoices</span>
        </div>
        <Link to="/invoices/new">
          <Button className="btn-primary-custom">
            <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Invoice
          </Button>
        </Link>
      </div>

      {loading && invoices.length === 0 ? <LoadingSpinner /> : invoices.length === 0 ? (
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
                <th>Amount</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv._id} onClick={() => window.open(`/invoices/${inv._id}`, '_blank')} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{inv.invoiceNumber}</td>
                  <td>{inv.customerSnapshot?.title ? `${inv.customerSnapshot.title}. ` : ''}{inv.customerSnapshot?.name || inv.customer?.name}</td>
                  <td>{formatDate(inv.invoiceDate)}</td>
                  <td className="money">{formatCurrency(inv.grandTotal)}</td>
                  <td className="money" style={{ color: inv.advancePayment > 0 ? 'var(--success)' : '#ccc' }}>{formatCurrency(inv.advancePayment || 0)}</td>
                  <td className="money" style={{ color: (inv.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(inv.balance || 0)}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1 flex-wrap">
                      <button className="btn-outline-custom btn-sm-custom" onClick={() => window.open(`/invoices/${inv._id}`, '_blank')}>View</button>
                      <button className="btn-sm-custom" style={btnStyle('rgba(177,145,198,0.1)', 'var(--primary)')} onClick={() => navigate(`/invoices/${inv._id}/edit`)}>Edit</button>
                      <button className="btn-sm-custom" style={btnStyle('rgba(59,130,246,0.1)', 'var(--info)')} title="Print" onClick={async () => {
                        try { const s = await getSettings(); await printInvoicePdf(inv, s.data); } catch { toast.error('Print failed'); }
                      }}>Print</button>
                      {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                        <button className="btn-sm-custom" style={btnStyle('rgba(34,197,94,0.1)', 'var(--success)')} onClick={() => { setAdvanceTarget(inv); setAdvanceAmount(''); }}>Pay</button>
                      )}
                      <button className="btn-sm-custom" style={btnStyle('rgba(239,68,68,0.1)', 'var(--danger)')} onClick={() => setDeleteTarget(inv)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* Payment Modal */}
      <Modal show={!!advanceTarget} onHide={() => setAdvanceTarget(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">Record Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {advanceTarget && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--tint)', borderRadius: 8, fontSize: '0.82rem' }}>
              <strong>{advanceTarget.invoiceNumber}</strong> — {advanceTarget.customerSnapshot?.name}<br />
              <span style={{ color: 'var(--accent)' }}>Total: {formatCurrency(advanceTarget.grandTotal)} | Already Paid: {formatCurrency(advanceTarget.advancePayment || 0)} | Balance: <strong style={{ color: 'var(--danger)' }}>{formatCurrency(advanceTarget.balance ?? advanceTarget.grandTotal)}</strong></span>
            </div>
          )}
          <Form.Group>
            <Form.Label className="form-label-custom">Payment Amount (LKR)</Form.Label>
            <Form.Control className="form-input" type="number" min="0.01" step="0.01" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} placeholder="0.00" />
            {advanceTarget && <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: '0.4rem' }}>Full balance: {formatCurrency(advanceTarget.balance ?? advanceTarget.grandTotal)} — enter this to mark as fully paid</div>}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setAdvanceTarget(null)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={handleAdvancePay} disabled={payingAdvance}>
            {payingAdvance ? 'Recording...' : 'Record Payment'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete invoice ${deleteTarget?.invoiceNumber}? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
