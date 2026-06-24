import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { PlusIcon, ReceiptRefundIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCustomerCredits, getCreditNotes, createCreditNote, deleteCreditNote } from '../api/creditNotes';
import { getCustomers } from '../api/customers';
import CustomerSelect from '../components/customers/CustomerSelect';
import CustomerForm from '../components/customers/CustomerForm';
import { createCustomer } from '../api/customers';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function CreditNotesPage() {
  const [customerCredits, setCustomerCredits] = useState([]);
  const [totalActiveAmount, setTotalActiveAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerNotes, setCustomerNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({ customer: '', amount: '', reason: '', notes: '' });
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomerCredits();
      setCustomerCredits(res.data.customerCredits);
      setTotalActiveAmount(res.data.totalActiveAmount);
    } catch { toast.error('Failed to load credit notes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCredits(); }, [fetchCredits]);

  const handleExpand = async (customerId) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      return;
    }
    setExpandedCustomer(customerId);
    setLoadingNotes(true);
    try {
      const res = await getCreditNotes({ customer: customerId });
      setCustomerNotes(res.data.creditNotes);
    } catch { toast.error('Failed to load details'); }
    finally { setLoadingNotes(false); }
  };

  const handleCreate = async () => {
    if (!formData.customer || !formData.amount || !formData.reason) {
      return toast.error('Fill in all required fields');
    }
    try {
      await createCreditNote({
        customer: formData.customer,
        amount: Number(formData.amount),
        reason: formData.reason,
        notes: formData.notes
      });
      toast.success('Credit note created');
      setShowForm(false);
      setFormData({ customer: '', amount: '', reason: '', notes: '' });
      setSelectedCustomerData(null);
      fetchCredits();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await deleteCreditNote(deleteTarget._id);
      toast.success('Credit note deleted');
      setDeleteTarget(null);
      fetchCredits();
      if (expandedCustomer) handleExpand(expandedCustomer);
    } catch { toast.error('Delete failed'); }
  };

  const handleNewCustomer = async (data) => {
    try {
      const res = await createCustomer(data);
      setFormData({ ...formData, customer: res.data._id });
      setSelectedCustomerData(res.data);
      setShowCustomerForm(false);
      toast.success('Customer created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.6rem 1.2rem', borderRadius: 10 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--info)' }}>Total Active Credits: </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{formatCurrency(totalActiveAmount)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', marginLeft: '0.5rem' }}>({customerCredits.length} customers)</span>
          </div>
        </div>
        <Button className="btn-primary-custom" onClick={() => setShowForm(true)}>
          <PlusIcon style={{ width: 16, height: 16, marginRight: 6 }} /> New Credit Note
        </Button>
      </div>

      {loading ? <LoadingSpinner /> : customerCredits.length === 0 ? (
        <EmptyState
          icon={ReceiptRefundIcon}
          title="No credit notes yet"
          message="Create a credit note when a customer has a refund or credit balance."
          action={<Button className="btn-primary-custom mt-3" onClick={() => setShowForm(true)}>Add Credit Note</Button>}
        />
      ) : (
        <div className="table-custom">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Active Credits</th>
                <th>Total Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customerCredits.map(({ customer, totalCredits, creditCount }) => (
                <>
                  <tr key={customer?._id} onClick={() => handleExpand(customer?._id)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{customer?.name}</td>
                    <td>{customer?.company || '-'}</td>
                    <td>{customer?.phone}</td>
                    <td>
                      <span className="status-badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)' }}>
                        {creditCount} {creditCount === 1 ? 'credit' : 'credits'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--info)' }}>{formatCurrency(totalCredits)}</td>
                    <td>
                      <button className="btn-outline-custom btn-sm-custom">
                        {expandedCustomer === customer?._id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedCustomer === customer?._id && (
                    <tr key={`${customer?._id}-details`}>
                      <td colSpan={6} style={{ padding: 0, background: 'var(--tint)' }}>
                        {loadingNotes ? (
                          <div style={{ padding: '1rem', textAlign: 'center' }}><LoadingSpinner /></div>
                        ) : (
                          <div style={{ padding: '1rem 1.5rem' }}>
                            <table style={{ width: '100%', fontSize: '0.82rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid rgba(177,145,198,0.15)' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Date</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reason</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Notes</th>
                                  <th style={{ padding: '0.4rem 0.5rem' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerNotes.map(note => (
                                  <tr key={note._id} style={{ borderBottom: '1px solid rgba(177,145,198,0.08)' }}>
                                    <td style={{ padding: '0.5rem' }}>{formatDate(note.createdAt)}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--info)' }}>{formatCurrency(note.amount)}</td>
                                    <td style={{ padding: '0.5rem' }}>{note.reason}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                      <span className="status-badge" style={{
                                        background: note.status === 'Active' ? 'rgba(34,197,94,0.1)' : note.status === 'Used' ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: note.status === 'Active' ? 'var(--success)' : note.status === 'Used' ? '#94A3B8' : 'var(--danger)'
                                      }}>{note.status}</span>
                                    </td>
                                    <td style={{ padding: '0.5rem', color: '#888', fontSize: '0.78rem' }}>{note.notes || '-'}</td>
                                    <td style={{ padding: '0.5rem' }} onClick={e => e.stopPropagation()}>
                                      <button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.25rem 0.6rem', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setDeleteTarget(note)}>Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Credit Note Modal */}
      <Modal show={showForm} onHide={() => setShowForm(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">New Credit Note</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Label className="form-label-custom">Customer *</Form.Label>
              <CustomerSelect
                value={formData.customer}
                onChange={(id, data) => { setFormData({ ...formData, customer: id }); setSelectedCustomerData(data); }}
                onAddNew={() => setShowCustomerForm(true)}
              />
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Amount (LKR) *</Form.Label>
                <Form.Control className="form-input" type="number" min="0.01" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Reason *</Form.Label>
                <Form.Control className="form-input" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Overpayment, Return, Discount" />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Notes</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={handleCreate}>Create Credit Note</Button>
        </Modal.Footer>
      </Modal>

      <CustomerForm show={showCustomerForm} onHide={() => setShowCustomerForm(false)} onSave={handleNewCustomer} customer={null} />

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Credit Note" message={`Delete this credit note of ${formatCurrency(deleteTarget?.amount)}?`} confirmText="Delete" />
    </div>
  );
}
