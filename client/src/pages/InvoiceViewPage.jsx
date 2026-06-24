import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getInvoice, updateInvoiceStatus, deleteInvoice } from '../api/invoices';
import { getSettings } from '../api/settings';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { generateInvoicePdf } from '../components/pdf/generatePdf';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    Promise.all([getInvoice(id), getSettings()])
      .then(([invRes, setRes]) => {
        setInvoice(invRes.data);
        setSettings(setRes.data);
      })
      .catch(() => toast.error('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateInvoiceStatus(id, status);
      toast.success(`Marked as ${status}`);
      const res = await getInvoice(id);
      setInvoice(res.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async () => {
    try {
      await deleteInvoice(id);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDownloadPdf = () => {
    if (invoice && settings) {
      generateInvoicePdf(invoice, settings);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!invoice) return <p>Invoice not found</p>;

  const snap = invoice.customerSnapshot || {};

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <Button variant="link" onClick={() => navigate('/invoices')} style={{ color: 'var(--primary-dark)', textDecoration: 'none', padding: 0 }}>
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </Button>
        <StatusBadge status={invoice.status} />
        <div style={{ marginLeft: 'auto' }} className="d-flex gap-2 flex-wrap">
          {invoice.status === 'Draft' && (
            <>
              <Link to={`/invoices/${id}/edit`}>
                <Button className="btn-outline-custom btn-sm-custom"><PencilIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Edit</Button>
              </Link>
              <Button className="btn-sm-custom" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStatusChange('Sent')}>Mark as Sent</Button>
            </>
          )}
          {invoice.status === 'Sent' && (
            <Button className="btn-sm-custom" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleStatusChange('Paid')}>Mark as Paid</Button>
          )}
          <Button className="btn-primary-custom btn-sm-custom" onClick={handleDownloadPdf}>
            <ArrowDownTrayIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Download PDF
          </Button>
          {invoice.status === 'Draft' && (
            <Button variant="outline-danger" size="sm" onClick={() => setShowDelete(true)}>Delete</Button>
          )}
        </div>
      </div>

      <div className="invoice-view-card">
        <div className="invoice-header">
          <div className="invoice-header-left">
            <img src="/logo.png" alt="Logo" className="invoice-header-logo" />
            <div>
              <div className="invoice-company-name">{settings?.companyName}</div>
              <div className="invoice-company-detail">
                {settings?.address}<br />
                Tel: {settings?.phone}<br />
                {settings?.email}
              </div>
            </div>
          </div>
          <div className="invoice-meta-box">
            <div className="invoice-meta-title">INVOICE</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div className="bill-to-label">Bill To</div>
            <div className="bill-to-name">{snap.name}</div>
            <div className="bill-to-detail">
              {snap.address && <div>{snap.address}</div>}
              {snap.phone && <div>Phone: {snap.phone}</div>}
              {snap.email && <div>Email: {snap.email}</div>}
              {snap.company && <div>Company: {snap.company}</div>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="invoice-meta-row"><strong>{invoice.invoiceNumber}</strong></div>
            <div className="invoice-meta-row">Date: <strong>{formatDate(invoice.invoiceDate)}</strong></div>
            {invoice.deliveryDate && <div className="invoice-meta-row">Delivery: <strong>{formatDate(invoice.deliveryDate)}</strong></div>}
            <div className="invoice-meta-row">Payment: {invoice.paymentType}</div>
          </div>
        </div>

        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Service</th>
              <th>Type</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'center' }}>Disc</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td><StatusBadge status={item.orderType} /></td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: 'center' }}>{item.discount > 0 ? `${item.discount}%` : '-'}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-total-section">
          <div className="invoice-total-box">
            <div className="invoice-total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="invoice-total-row" style={{ color: 'var(--danger)' }}>
                <span>Discount {invoice.discountType === 'percentage' ? `(${invoice.discountValue}%)` : ''}</span>
                <span>- {formatCurrency(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="invoice-total-row grand">
              <span>Grand Total</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        {(invoice.notes || invoice.terms || settings?.bankDetails?.bankName) && (
          <div className="invoice-footer">
            {invoice.notes && (
              <div className="mb-3">
                <div className="invoice-footer-title">Notes</div>
                <p style={{ margin: 0 }}>{invoice.notes}</p>
              </div>
            )}
            {invoice.terms && (
              <div className="mb-3">
                <div className="invoice-footer-title">Terms & Conditions</div>
                <p style={{ margin: 0 }}>{invoice.terms}</p>
              </div>
            )}
            {settings?.bankDetails?.bankName && (
              <div>
                <div className="invoice-footer-title">Bank Details</div>
                <p style={{ margin: 0 }}>
                  {settings.bankDetails.bankName} | Acc: {settings.bankDetails.accountNumber}
                  {settings.bankDetails.branchCode && ` | Branch: ${settings.bankDetails.branchCode}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete ${invoice.invoiceNumber}? This cannot be undone.`} confirmText="Delete" />
    </div>
  );
}
