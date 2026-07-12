import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button, Modal, Form, Row, Col } from 'react-bootstrap';
import { ArrowLeftIcon, PencilIcon, ArrowDownTrayIcon, ArrowPathIcon, EyeIcon, PrinterIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getQuotation, updateQuotationStatus, deleteQuotation, convertQuotationToInvoice } from '../api/quotations';
import { getSettings } from '../api/settings';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate, formatDateInput } from '../utils/formatDate';
import { PAYMENT_TYPES } from '../utils/constants';
import { generateQuotationPdf, previewQuotationPdf, printQuotationPdf, DEFAULT_TERMS } from '../components/pdf/generatePdf';

export default function QuotationViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertData, setConvertData] = useState({ deliveryDate: '', paymentType: 'Cash' });
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  useEffect(() => {
    Promise.all([getQuotation(id), getSettings()])
      .then(([qRes, sRes]) => { setQuotation(qRes.data); setSettings(sRes.data); })
      .catch(() => toast.error('Failed to load quotation'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateQuotationStatus(id, status);
      toast.success(`Marked as ${status}`);
      const res = await getQuotation(id);
      setQuotation(res.data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleConvert = async () => {
    if (!convertData.deliveryDate) return toast.error('Please set a delivery date');
    setConverting(true);
    try {
      const res = await convertQuotationToInvoice(id, {
        deliveryDate: convertData.deliveryDate,
        paymentType: convertData.paymentType
      });
      toast.success('Converted to Invoice!');
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setConverting(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteQuotation(id);
      toast.success('Quotation deleted');
      navigate('/quotations');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleDownloadPdf = () => {
    if (quotation && settings) generateQuotationPdf(quotation, settings);
  };

  const handlePreviewPdf = async () => {
    if (quotation && settings) {
      const url = await previewQuotationPdf(quotation, settings);
      setPdfPreviewUrl(url);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!quotation) return <p>Quotation not found</p>;

  const snap = quotation.customerSnapshot || {};

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        <Button variant="link" onClick={() => navigate('/quotations')} style={{ color: 'var(--primary-dark)', textDecoration: 'none', padding: 0 }}>
          <ArrowLeftIcon style={{ width: 20, height: 20 }} />
        </Button>
        <StatusBadge status={quotation.status} />
        <div style={{ marginLeft: 'auto' }} className="d-flex gap-2 flex-wrap">
          {quotation.status !== 'Converted' && (
            <Link to={`/quotations/${id}/edit`}>
              <Button className="btn-outline-custom btn-sm-custom"><PencilIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Edit</Button>
            </Link>
          )}
          {quotation.status === 'Draft' && (
            <Button className="btn-sm-custom" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)', border: 'none', borderRadius: 6, fontWeight: 600 }} onClick={() => handleStatusChange('Sent')}>Mark as Sent</Button>
          )}
          {quotation.status === 'Sent' && (
            <>
              <Button className="btn-sm-custom" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: 'none', borderRadius: 6, fontWeight: 600 }} onClick={() => handleStatusChange('Accepted')}>Accept</Button>
              <Button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, fontWeight: 600 }} onClick={() => handleStatusChange('Rejected')}>Reject</Button>
            </>
          )}
          {quotation.status === 'Accepted' && (
            <Button className="btn-sm-custom" style={{ background: 'rgba(99,102,241,0.15)', color: '#6366F1', border: 'none', borderRadius: 6, fontWeight: 600 }} onClick={() => setShowConvert(true)}>
              <ArrowPathIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Convert to Invoice
            </Button>
          )}
          {quotation.status === 'Converted' && quotation.convertedInvoice && (
            <Link to={`/invoices/${quotation.convertedInvoice._id || quotation.convertedInvoice}`}>
              <Button className="btn-sm-custom" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', border: 'none', borderRadius: 6, fontWeight: 600 }}>View Invoice ({quotation.convertedInvoice.invoiceNumber || 'Created'})</Button>
            </Link>
          )}
          <Button className="btn-outline-custom btn-sm-custom" onClick={handlePreviewPdf}>
            <EyeIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Preview PDF
          </Button>
          <Button className="btn-outline-custom btn-sm-custom" onClick={() => { if (quotation && settings) printQuotationPdf(quotation, settings); }}>
            <PrinterIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Print
          </Button>
          <Button className="btn-primary-custom btn-sm-custom" onClick={handleDownloadPdf}>
            <ArrowDownTrayIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Download PDF
          </Button>
          {quotation.status === 'Draft' && (
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
            <div className="invoice-meta-title">QUOTATION</div>
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
            <div className="invoice-meta-row"><strong>{quotation.quotationNumber}</strong></div>
            <div className="invoice-meta-row">Date: <strong>{formatDate(quotation.quotationDate)}</strong></div>
            <div className="invoice-meta-row">Valid Until: <strong>{formatDate(quotation.validUntil)}</strong></div>
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
            {quotation.items.map((item, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 500 }}>{item.name}</div>
                  {item.description && (
                    <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.4, color: 'var(--muted-ink)', whiteSpace: 'pre-line' }}>
                      {item.description}
                    </div>
                  )}
                </td>
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
              <span>Subtotal</span><span>{formatCurrency(quotation.subtotal)}</span>
            </div>
            {quotation.discountAmount > 0 && (
              <div className="invoice-total-row" style={{ color: 'var(--danger)' }}>
                <span>Discount {quotation.discountType === 'percentage' ? `(${quotation.discountValue}%)` : ''}</span>
                <span>- {formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}
            <div className="invoice-total-row grand">
              <span>Grand Total</span><span>{formatCurrency(quotation.grandTotal)}</span>
            </div>
            {quotation.advancePayment > 0 && (
              <>
                <div className="invoice-total-row" style={{ color: 'var(--success)' }}>
                  <span>Advance</span><span>- {formatCurrency(quotation.advancePayment)}</span>
                </div>
                <div className="invoice-total-row grand">
                  <span>Balance</span><span>{formatCurrency(quotation.balance ?? (quotation.grandTotal - quotation.advancePayment))}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="invoice-footer">
          {quotation.notes && (
            <div className="mb-3">
              <div className="invoice-footer-title">Notes</div>
              <p style={{ margin: 0 }}>{quotation.notes}</p>
            </div>
          )}
          <div>
            <div className="invoice-footer-title">Terms & Conditions</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-ink)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
{(settings?.pdfTerms || '').trim() || DEFAULT_TERMS}
            </div>
          </div>
        </div>
      </div>

      {/* Convert to Invoice Modal */}
      <Modal show={showConvert} onHide={() => setShowConvert(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">Convert to Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)', marginBottom: '1rem' }}>
            Set the delivery date and payment type for the new invoice.
          </p>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Delivery Date *</Form.Label>
                <Form.Control className="form-input" type="date" value={convertData.deliveryDate} onChange={e => setConvertData({ ...convertData, deliveryDate: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Payment Type</Form.Label>
                <Form.Select className="form-input" value={convertData.paymentType} onChange={e => setConvertData({ ...convertData, paymentType: e.target.value })}>
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--tint)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--accent)' }}>
            This will create a new Draft invoice with all items from quotation <strong>{quotation.quotationNumber}</strong> ({formatCurrency(quotation.grandTotal)}).
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConvert(false)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={handleConvert} disabled={converting}>
            {converting ? 'Converting...' : 'Convert to Invoice'}
          </Button>
        </Modal.Footer>
      </Modal>

      <ConfirmModal show={showDelete} onHide={() => setShowDelete(false)} onConfirm={handleDelete} title="Delete Quotation" message={`Delete ${quotation.quotationNumber}?`} confirmText="Delete" />

      <Modal show={!!pdfPreviewUrl} onHide={() => setPdfPreviewUrl(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">PDF Preview — {quotation.quotationNumber}</Modal.Title>
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
