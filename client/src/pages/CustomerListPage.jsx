import { useState, useEffect, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import CustomerForm from '../components/customers/CustomerForm';
import SearchInput from '../components/common/SearchInput';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';

export default function CustomerListPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ search, page, limit: 20 });
      setCustomers(res.data.customers);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateCustomer(editing._id, data);
        toast.success('Customer updated');
      } else {
        await createCustomer(data);
        toast.success('Customer created');
      }
      setShowForm(false);
      setEditing(null);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCustomer(deleteTarget._id);
      toast.success('Customer removed');
      setDeleteTarget(null);
      fetchCustomers();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customers..." />
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} customers</span>
        </div>
        <Button className="btn-primary-custom" onClick={() => { setEditing(null); setShowForm(true); }}>
          <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Customer
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : customers.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="No customers yet"
          message="Add your first customer to start creating invoices."
          action={<Button className="btn-primary-custom mt-3" onClick={() => setShowForm(true)}>Add Customer</Button>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Invoices</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{c.name}</td>
                  <td>{c.company || '-'}</td>
                  <td>{c.phone}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.totalInvoices}</td>
                  <td>{formatCurrency(c.totalSpent)}</td>
                  <td>
                    <button className="btn-outline-custom btn-sm-custom me-1" onClick={() => { setEditing(c); setShowForm(true); }}>Edit</button>
                    <button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setDeleteTarget(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      <CustomerForm show={showForm} onHide={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} customer={editing} />

      <ConfirmModal
        show={!!deleteTarget}
        onHide={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to remove "${deleteTarget?.name}"?`}
        confirmText="Delete"
      />
    </div>
  );
}
