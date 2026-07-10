import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptRefundIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getCustomerCredits, getCreditNotes, deleteCreditNote } from '../api/creditNotes';
import ConfirmModal from '../components/common/ConfirmModal';
import DateRangeFilter from '../components/common/DateRangeFilter';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';

export default function CreditNotesPage() {
  const navigate = useNavigate();
  const [customerCredits, setCustomerCredits] = useState([]);
  const [totalActiveAmount, setTotalActiveAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [customerNotes, setCustomerNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchCredits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomerCredits({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      setCustomerCredits(res.data.customerCredits);
      setTotalActiveAmount(res.data.totalActiveAmount);
    } catch { toast.error('Failed to load credit notes'); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

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

  const handleDelete = async () => {
    try {
      await deleteCreditNote(deleteTarget._id);
      toast.success('Credit note deleted');
      setDeleteTarget(null);
      fetchCredits();
      if (expandedCustomer) handleExpand(expandedCustomer);
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="action-bar">
        <div className="action-bar-left">
          <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.6rem 1.2rem', borderRadius: 10 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--info)' }}>Total Active Credits: </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{formatCurrency(totalActiveAmount)}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--accent)', marginLeft: '0.5rem' }}>({customerCredits.length} customers)</span>
          </div>
          <DateRangeFilter
            from={dateFrom} to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
            onClear={() => { setDateFrom(''); setDateTo(''); }}
          />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
          Credit notes are created automatically when an invoice uses "Credits" payment type.
        </div>
      </div>

      {loading ? <LoadingSpinner /> : customerCredits.length === 0 ? (
        <EmptyState
          icon={ReceiptRefundIcon}
          title="No credit notes yet"
          message="Credit notes are created automatically when you create an invoice with 'Credits' payment type."
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
                          <div style={{ padding: '0.75rem 1.5rem' }}>
                            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid rgba(177,145,198,0.15)' }}>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Date</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Amount</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Reason</th>
                                  <th style={{ padding: '0.4rem 0.5rem', color: 'var(--accent)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Status</th>
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
                                        background: note.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                                        color: note.status === 'Active' ? 'var(--success)' : '#94A3B8'
                                      }}>{note.status}</span>
                                    </td>
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

      <ConfirmModal show={!!deleteTarget} onHide={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Credit Note" message={`Delete this credit note of ${formatCurrency(deleteTarget?.amount)}?`} confirmText="Delete" />
    </div>
  );
}
