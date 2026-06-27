import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getOrders, updateOrderStatus, approveOrder } from '../api/orders';
import SearchInput from '../components/common/SearchInput';
import StatusBadge from '../components/common/StatusBadge';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatDate } from '../utils/formatDate';
import { ORDER_STATUS_OPTIONS } from '../utils/constants';
import { ClipboardDocumentListIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders({ search, status: statusFilter || undefined, page, limit: 20 });
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (e, orderId) => {
    e.stopPropagation();
    try {
      await updateOrderStatus(orderId, e.target.value);
      toast.success('Order status updated');
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApprove = async (e, orderId) => {
    e.stopPropagation();
    try {
      await approveOrder(orderId);
      toast.success('Order approved');
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search orders..." />
          <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {ORDER_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} orders</span>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <EmptyState
          icon={ClipboardDocumentListIcon}
          title="No orders yet"
          message="Orders are automatically created when invoices are created with order numbers."
        />
      ) : (
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
                <th>Status</th>
                <th>Approval</th>
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
                  <td>{order.customerSnapshot?.title ? `${order.customerSnapshot.title}. ` : ''}{order.customerSnapshot?.name}</td>
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
                      onChange={e => handleStatusChange(e, order._id)}
                      style={{
                        fontSize: '0.75rem', padding: '0.3rem 0.5rem', minWidth: 110,
                        fontWeight: 600, borderRadius: 6
                      }}
                    >
                      {ORDER_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {order.approved ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)',
                        background: 'rgba(34,197,94,0.1)', padding: '0.3rem 0.6rem', borderRadius: 6
                      }}>
                        <CheckCircleIcon style={{ width: 14, height: 14 }} /> Approved
                      </span>
                    ) : (
                      <button
                        className="btn-primary-custom"
                        style={{ fontSize: '0.72rem', padding: '0.3rem 0.7rem' }}
                        onClick={e => handleApprove(e, order._id)}
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
