import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';
import { ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getInvoice, updateInvoiceStatus, deleteInvoice } from '../api/invoices';
import { getSettings } from '../api/settings';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { generateInvoicePdf, previewInvoicePdf, DEFAULT_TERMS } from '../components/pdf/generatePdf';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

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
    if (invoice && settings) generateInvoicePdf(invoice, settings);
  };

  const handlePreviewPdf = async () => {
    if (invoice && settings) {
      const url = await previewInvoicePdf(invoice, settings);
      setPdfPreviewUrl(url);
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
          <Button className="btn-outline-custom btn-sm-custom" onClick={handlePreviewPdf}>
            <EyeIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Preview PDF
          </Button>
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
            <div>
              <div className="invoice-company-name" style={{ fontSize: '1.8rem' }}>{settings?.companyName}</div>
              <div className="invoice-company-detail">
                {settings?.address?.replace(', Sri Lanka', '')}<br />
                Tel: {settings?.landline || '011 287 0057'}<br />
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
            <div className="bill-to-name">{snap.title ? `${snap.title}. ` : ''}{snap.name}</div>
            <div className="bill-to-detail">
              {snap.address && <div>{snap.address}</div>}
              {snap.phone && <div>Phone: {snap.phone}</div>}
              {snap.email && <div>Email: {snap.email}</div>}
              {snap.company && <div>Company: {snap.company}</div>}
            </div>
          </div>
          <div>
            <table style={{ fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr><td style={{ color: '#888', paddingRight: '1rem', paddingBottom: '0.3rem' }}>Invoice No</td><td style={{ fontWeight: 600, color: 'var(--primary)', paddingBottom: '0.3rem' }}>{invoice.invoiceNumber}</td></tr>
                <tr><td style={{ color: '#888', paddingRight: '1rem', paddingBottom: '0.3rem' }}>Date</td><td style={{ fontWeight: 600, paddingBottom: '0.3rem' }}>{formatDate(invoice.invoiceDate)}</td></tr>
                {invoice.deliveryDate && <tr><td style={{ color: '#888', paddingRight: '1rem', paddingBottom: '0.3rem' }}>Delivery</td><td style={{ fontWeight: 600, paddingBottom: '0.3rem' }}>{formatDate(invoice.deliveryDate)}</td></tr>}
                <tr><td style={{ color: '#888', paddingRight: '1rem' }}>Payment</td><td style={{ fontWeight: 500 }}>{invoice.paymentType}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <table className="invoice-items-table" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--primary)' }}>
              <th style={{ color: '#fff', textAlign: 'center' }}>Product / Service</th>
              <th style={{ color: '#fff', textAlign: 'center' }}>Qty</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>Unit Price</th>
              <th style={{ color: '#fff', textAlign: 'center' }}>Disc</th>
              <th style={{ color: '#fff', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
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
            {(invoice.advancePayment || 0) > 0 && (
              <div className="invoice-total-row" style={{ color: 'var(--success)' }}>
                <span>Advance Paid</span>
                <span>- {formatCurrency(invoice.advancePayment)}</span>
              </div>
            )}
            <div className="invoice-total-row grand">
              <span>Grand Total</span>
              <span>{formatCurrency((invoice.advancePayment > 0) ? (invoice.grandTotal - invoice.advancePayment) : invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-footer">
          {settings?.bankDetails?.bankName && (
            <div className="mb-3">
              <div className="invoice-footer-title">Bank Details</div>
              <p style={{ margin: 0 }}>
                {settings.bankDetails.bankName} | Acc: {settings.bankDetails.accountNumber}
                {settings.bankDetails.branchCode && ` | Branch: ${settings.bankDetails.branchCode}`}
              </p>
            </div>
          )}
          <div>
            <div className="invoice-footer-title">Terms & Conditions</div>
            <div style={{ fontSize: '0.75rem', color: '#666', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
{(settings?.pdfTerms || '').trim() || DEFAULT_TERMS}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Invoice" message={`Delete ${invoice.invoiceNumber}? This cannot be undone.`} confirmText="Delete" />

      <Modal show={!!pdfPreviewUrl} onHide={() => setPdfPreviewUrl(null)} size="lg" centered dialogClassName="pdf-preview-modal">
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">PDF Preview — {invoice.invoiceNumber}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: '75vh' }}>
          {pdfPreviewUrl && <iframe src={pdfPreviewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="PDF Preview" />}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setPdfPreviewUrl(null)}>Close</Button>
          <Button className="btn-primary-custom" onClick={handleDownloadPdf}>
            <ArrowDownTrayIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Download
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
