import { useState, useEffect, useCallback } from 'react';
import { Button } from 'react-bootstrap';
import { PlusIcon, CubeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products';
import ProductForm from '../components/products/ProductForm';
import SearchInput from '../components/common/SearchInput';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { SERVICE_TYPES } from '../utils/constants';

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ search, serviceType: serviceType || undefined });
      setProducts(res.data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, serviceType]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSave = async (data) => {
    try {
      if (editing) {
        await updateProduct(editing._id, data);
        toast.success('Product updated');
      } else {
        await createProduct(data);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditing(null);
      fetchProducts();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct(deleteTarget._id);
      toast.success('Product removed');
      setDeleteTarget(null);
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={setSearch} placeholder="Search products..." />
        </div>
        <Button className="btn-primary-custom" onClick={() => { setEditing(null); setShowForm(true); }}>
          <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Product
        </Button>
      </div>

      <div className="service-tabs">
        <button className={`service-tab ${serviceType === '' ? 'active' : ''}`} onClick={() => setServiceType('')}>All</button>
        {SERVICE_TYPES.map(t => (
          <button key={t} className={`service-tab ${serviceType === t ? 'active' : ''}`} onClick={() => setServiceType(t)}>{t}</button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <EmptyState
          icon={CubeIcon}
          title="No products yet"
          message="Add your services and products to use in invoices."
          action={<Button className="btn-primary-custom mt-3" onClick={() => setShowForm(true)}>Add Product</Button>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Service Type</th>
                <th>Default Price</th>
                <th>Unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{p.name}</td>
                  <td>{p.category}</td>
                  <td><span className="status-badge" style={{ background: p.serviceType === 'Design Wear' ? 'rgba(177,145,198,0.12)' : 'rgba(59,130,246,0.1)', color: p.serviceType === 'Design Wear' ? 'var(--primary)' : 'var(--info)' }}>{p.serviceType}</span></td>
                  <td>{formatCurrency(p.defaultPrice)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.unit}</td>
                  <td>
                    <button className="btn-outline-custom btn-sm-custom me-1" onClick={() => { setEditing(p); setShowForm(true); }}>Edit</button>
                    <button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.35rem 0.8rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setDeleteTarget(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProductForm show={showForm} onHide={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} product={editing} />

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Product" message={`Remove "${deleteTarget?.name}"?`} confirmText="Delete" />
    </div>
  );
}
