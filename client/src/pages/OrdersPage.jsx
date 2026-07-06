import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getOrders, updateOrderStatus, deleteOrder } from '../api/orders';
import { generateOrderPdf, previewOrderPdf } from '../components/pdf/generateOrderPdf';
import SearchInput from '../components/common/SearchInput';
import DateRangeFilter from '../components/common/DateRangeFilter';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import { ORDER_STATUS_OPTIONS } from '../utils/constants';
import { BRAND } from '../brand';
import { ClipboardDocumentListIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ search, status: statusFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, limit: 20 });
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [search, statusFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (e, orderId, order) => {
    e.stopPropagation();
    const newStatus = e.target.value;
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`${BRAND.orderNoun} status updated`);
      if (newStatus === 'Processing') {
        const url = await previewOrderPdf(order);
        setPreviewUrl(url);
        setPreviewOrder(order);
      }
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handlePreview = async (e, order) => {
    e.stopPropagation();
    try {
      const url = await previewOrderPdf(order);
      setPreviewUrl(url);
      setPreviewOrder(order);
    } catch { toast.error('Failed to generate preview'); }
  };

  const handleDownload = async (e, order) => {
    e.stopPropagation();
    try {
      await generateOrderPdf(order);
    } catch { toast.error('Failed to generate PDF'); }
  };

  const handleDelete = async () => {
    try {
      await deleteOrder(deleteTarget._id);
      toast.success('Order deleted');
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewOrder(null);
  };

  const btnStyle = (bg, color) => ({
    background: bg, color, border: 'none', borderRadius: 6,
    padding: '0.3rem 0.45rem', fontSize: '0.72rem', fontWeight: 600,
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center'
  });

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={`Search ${BRAND.ordersLabel.toLowerCase()}...`} />
          <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {ORDER_STATUS_OPTIONS.map(s => <option key={s} value={s}>{BRAND.statusLabels[s] || s}</option>)}
          </select>
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={v => { setDateFrom(v); setPage(1); }}
            onToChange={v => { setDateTo(v); setPage(1); }}
            onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} {BRAND.ordersLabel.toLowerCase()}</span>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title={`No ${BRAND.ordersLabel.toLowerCase()} yet`}
          message={`${BRAND.ordersLabel} are automatically created when invoices are created with ${BRAND.orderNoun.toLowerCase()} numbers.`}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>{BRAND.orderNoun} #</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th>Invoice Date</th>
                <th>Delivery Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: order.orderType === 'Sample' ? 'var(--primary)' : 'var(--info)',
                      background: order.orderType === 'Sample' ? 'rgba(177,145,198,0.12)' : 'rgba(59,130,246,0.1)',
                      padding: '0.25rem 0.6rem', borderRadius: 4
                    }}>
                      {order.orderNumber}
                    </span>
                  </td>
                  <td style={{ fontWeight: 500 }}>{order.productName}</td>
                  <td>
                    {order.customerSnapshot?.title ? `${order.customerSnapshot.title}. ` : ''}{order.customerSnapshot?.name}
                    {order.customerSnapshot?.phone && <span style={{ color: 'var(--soft-ink)', fontSize: '0.78rem', marginLeft: 6 }}>{order.customerSnapshot.phone}</span>}
                  </td>
                  <td>
                    <span
                      style={{ fontWeight: 600, color: 'var(--primary-dark)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate(`/invoices/${order.invoice}`)}
                    >
                      {order.invoiceNumber}
                    </span>
                  </td>
                  <td>{formatDate(order.invoiceDate)}</td>
                  <td>{order.deliveryDate ? formatDate(order.deliveryDate) : <span style={{ color: '#ccc' }}>—</span>}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <select
                      className="filter-select"
                      value={order.status}
                      onChange={e => handleStatusChange(e, order._id, order)}
                      style={{
                        fontSize: '0.75rem', padding: '0.3rem 0.5rem', minWidth: 110,
                        fontWeight: 600, borderRadius: 6
                      }}
                    >
                      {ORDER_STATUS_OPTIONS.map(s => <option key={s} value={s}>{BRAND.statusLabels[s] || s}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="d-flex gap-1">
                      <button style={btnStyle('rgba(177,145,198,0.12)', 'var(--primary)')} onClick={e => handlePreview(e, order)} title="Preview PDF">
                        <EyeIcon style={{ width: 15, height: 15 }} />
                      </button>
                      <button style={btnStyle('rgba(59,130,246,0.1)', 'var(--info)')} onClick={e => handleDownload(e, order)} title="Download PDF">
                        <ArrowDownTrayIcon style={{ width: 15, height: 15 }} />
                      </button>
                      <button style={btnStyle('rgba(239,68,68,0.1)', 'var(--danger)')} onClick={e => { e.stopPropagation(); setDeleteTarget(order); }} title={`Delete ${BRAND.orderNoun}`}>
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* PDF Preview Modal */}
      <Modal show={!!previewUrl} onHide={closePreview} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom" style={{ fontSize: '1rem' }}>
            {BRAND.orderNoun} PDF — {previewOrder?.orderNumber}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0 }}>
          <iframe
            src={previewUrl}
            style={{ width: '100%', height: '75vh', border: 'none' }}
            title="Order PDF Preview"
          />
        </Modal.Body>
        <Modal.Footer>
          <button className="btn-outline-custom" onClick={closePreview}>Close</button>
          <button className="btn-primary-custom" onClick={() => { if (previewOrder) generateOrderPdf(previewOrder); }}>
            <ArrowDownTrayIcon style={{ width: 16, height: 16, marginRight: 6 }} /> Download PDF
          </button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title={`Delete ${BRAND.orderNoun}`} message={`Delete ${BRAND.orderNoun.toLowerCase()} ${deleteTarget?.orderNumber}? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
