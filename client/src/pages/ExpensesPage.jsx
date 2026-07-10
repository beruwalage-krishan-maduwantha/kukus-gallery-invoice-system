import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { PlusIcon, BanknotesIcon, TrashIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
import api from '../api/axios';
import SearchInput from '../components/common/SearchInput';
import DateRangeFilter from '../components/common/DateRangeFilter';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateInput } from '../utils/formatDate';
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from '../utils/constants';

const emptyForm = { title: '', category: '', amount: '', date: formatDateInput(new Date()), description: '', paymentMethod: 'Cash', chequeReleaseDate: '', reference: '' };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [attachFile, setAttachFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [previewExp, setPreviewExp] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExpenses({ search, category: catFilter || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page, limit: 20 });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setTotalAmount(res.data.totalAmount);
      setPages(res.data.pages);
    } catch { toast.error('Failed to load expenses'); }
    finally { setLoading(false); }
  }, [search, catFilter, dateFrom, dateTo, page]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setAttachFile(null);
    setExistingAttachment(null);
    setRemoveAttachment(false);
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditingId(exp._id);
    setForm({
      title: exp.title, category: exp.category, amount: exp.amount,
      date: formatDateInput(exp.date), description: exp.description || '',
      paymentMethod: exp.paymentMethod || 'Cash',
      chequeReleaseDate: exp.chequeReleaseDate ? formatDateInput(exp.chequeReleaseDate) : '',
      reference: exp.reference || ''
    });
    setAttachFile(null);
    setExistingAttachment(exp.attachment?.filename ? exp.attachment : null);
    setRemoveAttachment(false);
    setShowForm(true);
  };

  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 7 * 1024 * 1024) {
      toast.error('File too large — maximum 7 MB');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1];
      setAttachFile({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: base64 });
      setRemoveAttachment(false);
    };
    reader.readAsDataURL(file);
  };

  const downloadAttachment = async (exp) => {
    try {
      const res = await api.get(`/expenses/${exp._id}/attachment`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = exp.attachment?.filename || 'attachment';
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download attachment'); }
  };

  const openPreview = async (exp) => {
    try {
      const res = await api.get(`/expenses/${exp._id}/attachment`, { responseType: 'blob' });
      const type = res.data.type || exp.attachment?.mimeType || '';
      setPreviewType(type);
      setPreviewUrl(URL.createObjectURL(res.data));
      setPreviewExp(exp);
    } catch { toast.error('Failed to load attachment'); }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewExp(null);
    setPreviewType('');
  };

  const deleteAttachment = async () => {
    if (!previewExp) return;
    if (!window.confirm(`Delete the attached file "${previewExp.attachment?.filename}"? The expense itself will be kept.`)) return;
    try {
      await updateExpense(previewExp._id, { removeAttachment: true });
      toast.success('Attachment deleted');
      closePreview();
      fetchExpenses();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete attachment'); }
  };

  const handleSave = async () => {
    if (!form.title || !form.category || !form.amount) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        chequeReleaseDate: form.paymentMethod === 'Cheque' && form.chequeReleaseDate ? form.chequeReleaseDate : null,
        attachment: attachFile ? { name: attachFile.name, type: attachFile.type, data: attachFile.data } : undefined,
        removeAttachment: removeAttachment || undefined
      };
      if (editingId) {
        await updateExpense(editingId, payload);
        toast.success('Expense updated');
      } else {
        await createExpense(payload);
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
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={v => { setDateFrom(v); setPage(1); }}
            onToChange={v => { setDateTo(v); setPage(1); }}
            onClear={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
          />
          <span style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>{total} expenses</span>
          <span className="money" style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>{formatCurrency(totalAmount)}</span>
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
                  <td className="money" style={{ textAlign: 'right', color: 'var(--danger)' }}>{formatCurrency(exp.amount)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>
                    {exp.paymentMethod}
                    {exp.paymentMethod === 'Cheque' && exp.chequeReleaseDate && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--soft-ink)' }}>Release: {formatDate(exp.chequeReleaseDate)}</div>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--soft-ink)' }}>
                    {exp.reference || '—'}
                    {exp.attachment?.filename && (
                      <div>
                        <button onClick={() => downloadAttachment(exp)} title={exp.attachment.filename} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--info)', fontSize: '0.75rem', fontWeight: 600, textDecoration: 'underline' }}>
                          📎 {exp.attachment.filename.length > 22 ? exp.attachment.filename.slice(0, 20) + '…' : exp.attachment.filename}
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      {exp.attachment?.filename && (
                        <button style={btnStyle('rgba(59,130,246,0.1)', 'var(--info)')} onClick={() => openPreview(exp)} title="Preview bill">
                          <EyeIcon style={{ width: 15, height: 15 }} />
                        </button>
                      )}
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
            {form.paymentMethod === 'Cheque' && (
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="form-label-custom">Cheque Release Date</Form.Label>
                  <Form.Control className="form-input" type="date" value={form.chequeReleaseDate} onChange={e => setForm({ ...form, chequeReleaseDate: e.target.value })} />
                </Form.Group>
              </Col>
            )}
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Reference / Receipt #</Form.Label>
                <Form.Control className="form-input" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Optional" />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Attach Receipt / File</Form.Label>
                <Form.Control className="form-input" type="file" onChange={handleFilePick} />
                {attachFile && (
                  <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--success)' }}>
                    New file: {attachFile.name} ({(attachFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
                {!attachFile && existingAttachment && !removeAttachment && (
                  <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--muted-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Current: {existingAttachment.filename} ({((existingAttachment.size || 0) / 1024).toFixed(0)} KB)</span>
                    <button type="button" onClick={() => setRemoveAttachment(true)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}>Remove</button>
                  </div>
                )}
                {removeAttachment && (
                  <div style={{ fontSize: '0.78rem', marginTop: '0.4rem', color: 'var(--danger)' }}>
                    Attachment will be removed on save
                  </div>
                )}
                <div style={{ fontSize: '0.7rem', color: 'var(--soft-ink)', marginTop: '0.25rem' }}>Any file type, up to 7 MB</div>
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

      {/* Bill Preview Modal */}
      <Modal show={!!previewUrl} onHide={closePreview} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom" style={{ fontSize: '1rem' }}>
            {previewExp?.title} — {previewExp?.attachment?.filename}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, textAlign: 'center', background: 'rgba(0,0,0,0.03)' }}>
          {previewType.startsWith('image/') ? (
            <img src={previewUrl} alt={previewExp?.attachment?.filename} style={{ maxWidth: '100%', maxHeight: '75vh' }} />
          ) : previewType === 'application/pdf' ? (
            <iframe src={previewUrl} style={{ width: '100%', height: '75vh', border: 'none' }} title="Bill preview" />
          ) : (
            <div style={{ padding: '3rem 1rem', color: 'var(--muted-ink)', fontSize: '0.9rem' }}>
              This file type can't be previewed here.<br />Use the download button below to open it.
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button onClick={deleteAttachment} style={{ marginRight: 'auto', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 8, padding: '0.55rem 1.2rem', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
            <TrashIcon style={{ width: 15, height: 15, marginRight: 6, verticalAlign: 'text-bottom' }} /> Delete File
          </button>
          <button className="btn-outline-custom" onClick={closePreview}>Close</button>
          <button className="btn-primary-custom" onClick={() => { if (previewExp) downloadAttachment(previewExp); }}>
            <ArrowDownTrayIcon style={{ width: 16, height: 16, marginRight: 6 }} /> Download
          </button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Expense" message={`Delete "${deleteTarget?.title}"? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
