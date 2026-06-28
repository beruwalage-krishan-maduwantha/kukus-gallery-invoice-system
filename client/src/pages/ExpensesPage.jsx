import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { PlusIcon, BanknotesIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import SearchInput from '../components/common/SearchInput';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateInput } from '../utils/formatDate';
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../utils/constants';

const emptyForm = { title: '', category: '', amount: '', date: formatDateInput(new Date()), description: '', paymentMethod: 'Cash', reference: '' };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ search, category: catFilter || undefined, page, limit: 20 });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setTotalAmount(res.data.totalAmount);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [search, catFilter, page]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditingId(exp._id);
    setForm({
      title: exp.title, category: exp.category, amount: exp.amount,
      date: formatDateInput(exp.date), description: exp.description || '',
      paymentMethod: exp.paymentMethod || 'Cash', reference: exp.reference || ''
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.category || !form.amount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      if (editingId) {
        await updateExpense(editingId, { ...form, amount: Number(form.amount) });
        toast.success('Expense updated');
      } else {
        await createExpense({ ...form, amount: Number(form.amount) });
        toast.success('Expense added');
      }
      setShowForm(false);
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(deleteTarget._id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const btnStyle = (bg, color) => ({ background: bg, color, border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' });

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search expenses..." />
          <select className="filter-select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} expenses</span>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(totalAmount)}</span>
        </div>
        <Button className="btn-primary-custom" onClick={openAdd}>
          <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> Add Expense
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : expenses.length === 0 ? (
        <EmptyState
          icon={BanknotesIcon}
          title="No expenses yet"
          message="Track your business expenses to see profit."
          action={<Button className="btn-primary-custom mt-3" onClick={openAdd}>Add Expense</Button>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Payment</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp._id}>
                  <td>{formatDate(exp.date)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{exp.title}</td>
                  <td>
                    <span className="status-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.82rem', color: '#666' }}>{exp.paymentMethod}</td>
                  <td style={{ fontSize: '0.82rem', color: '#999' }}>{exp.reference || '—'}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button style={btnStyle('rgba(177,145,198,0.1)', 'var(--primary)')} onClick={() => openEdit(exp)}>Edit</button>
                      <button style={btnStyle('rgba(239,68,68,0.1)', 'var(--danger)')} onClick={() => setDeleteTarget(exp)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* Add/Edit Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">{editingId ? 'Edit Expense' : 'Add Expense'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Title *</Form.Label>
                <Form.Control className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Fabric purchase" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Category *</Form.Label>
                <Form.Select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Amount (LKR) *</Form.Label>
                <Form.Control className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Date</Form.Label>
                <Form.Control className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Payment Method</Form.Label>
                <Form.Select className="form-input" value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
                  {EXPENSE_PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Reference / Receipt #</Form.Label>
                <Form.Control className="form-input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Optional" />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Description</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional notes..." />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : (editingId ? 'Update' : 'Add Expense')}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Expense" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
