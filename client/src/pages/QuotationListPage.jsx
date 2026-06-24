import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { PlusIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getQuotations, deleteQuotation, updateQuotationStatus, convertQuotationToInvoice } from '../api/quotations';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { QUOTATION_STATUS_OPTIONS } from '../utils/constants';

export default function QuotationListPage() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [converting, setConverting] = useState(null);

  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getQuotations({ search, status: statusFilter || undefined, page, limit: 20 });
      setQuotations(res.data.quotations);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load quotations'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success(`Quotation marked as ${status}`);
      fetchQuotations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleConvert = async (id) => {
    setConverting(id);
    try {
      const res = await convertQuotationToInvoice(id);
      toast.success('Quotation converted to Invoice!');
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Conversion failed'); }
    finally { setConverting(null); }
  };

  const handleDelete = async () => {
    try {
      await deleteQuotation(deleteTarget._id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
      fetchQuotations();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' });

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search quotations..." />
          <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {QUOTATION_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} quotations</span>
        </div>
        <Link to="/quotations/new">
          <Button className="btn-primary-custom">
            <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Quotation
          </Button>
        </Link>
      </div>

      {loading ? <LoadingSpinner /> : quotations.length === 0 ? (
        <EmptyState
          icon={DocumentDuplicateIcon}
          title="No quotations yet"
          message="Create your first quotation to send to customers."
          action={<Link to="/quotations/new"><Button className="btn-primary-custom mt-3">Create Quotation</Button></Link>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Valid Until</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q._id} onClick={() => navigate(`/quotations/${q._id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{q.quotationNumber}</td>
                  <td>{q.customerSnapshot?.name || q.customer?.name}</td>
                  <td>{formatDate(q.quotationDate)}</td>
                  <td>{formatDate(q.validUntil)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(q.grandTotal)}</td>
                  <td><StatusBadge status={q.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1 flex-wrap">
                      <button className="btn-outline-custom btn-sm-custom" onClick={() => navigate(`/quotations/${q._id}`)}>View</button>
                      {q.status === 'Draft' && (
                        <>
                          <button className="btn-sm-custom" style={btnStyle('rgba(177,145,198,0.1)', 'var(--primary)')} onClick={() => navigate(`/quotations/${q._id}/edit`)}>Edit</button>
                          <button className="btn-sm-custom" style={btnStyle('rgba(59,130,246,0.1)', 'var(--info)')} onClick={() => handleStatusChange(q._id, 'Sent')}>Send</button>
                          <button className="btn-sm-custom" style={btnStyle('rgba(239,68,68,0.1)', 'var(--danger)')} onClick={() => setDeleteTarget(q)}>Del</button>
                        </>
                      )}
                      {q.status === 'Sent' && (
                        <>
                          <button className="btn-sm-custom" style={btnStyle('rgba(34,197,94,0.1)', 'var(--success)')} onClick={() => handleStatusChange(q._id, 'Accepted')}>Accept</button>
                          <button className="btn-sm-custom" style={btnStyle('rgba(239,68,68,0.1)', 'var(--danger)')} onClick={() => handleStatusChange(q._id, 'Rejected')}>Reject</button>
                        </>
                      )}
                      {q.status === 'Accepted' && (
                        <button className="btn-sm-custom" style={btnStyle('rgba(99,102,241,0.15)', '#6366F1')} onClick={() => handleConvert(q._id)} disabled={converting === q._id}>
                          {converting === q._id ? 'Converting...' : 'Convert to Invoice'}
                        </button>
                      )}
                      {q.status === 'Converted' && q.convertedInvoice && (
                        <button className="btn-sm-custom" style={btnStyle('rgba(99,102,241,0.1)', '#6366F1')} onClick={() => navigate(`/invoices/${q.convertedInvoice._id || q.convertedInvoice}`)}>
                          View Invoice
                        </button>
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
      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Quotation" message={`Delete quotation ${deleteTarget?.quotationNumber}?`} confirmText="Delete" />
    </div>
  );
}
