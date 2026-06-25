import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Button } from 'react-bootstrap';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createInvoice, getInvoice, updateInvoice } from '../api/invoices';
import { getProducts } from '../api/products';
import CustomerSelect from '../components/customers/CustomerSelect';
import CustomerForm from '../components/customers/CustomerForm';
import { createCustomer } from '../api/customers';
import LineItemRow from '../components/invoices/LineItemRow';
import InvoiceSummary from '../components/invoices/InvoiceSummary';
import InvoicePreview from '../components/invoices/InvoicePreview';
import { PAYMENT_TYPES } from '../utils/constants';
import { formatDateInput } from '../utils/formatDate';

const emptyItem = { product: '', name: '', category: '', orderType: 'Sample', quantity: 1, unitPrice: 0, discount: 0, lineTotal: 0 };

export default function InvoiceCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [customerId, setCustomerId] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentType, setPaymentType] = useState('Cash');
  const [invoiceDate, setInvoiceDate] = useState(formatDateInput(new Date()));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [advancePayment, setAdvancePayment] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    getProducts({ limit: 100 }).then(res => setProducts(res.data.products));
  }, []);

  useEffect(() => {
    if (isEdit) {
      getInvoice(id).then(res => {
        const inv = res.data;
        setCustomerId(inv.customer?._id || '');
        setCustomerData(inv.customer);
        setItems(inv.items.map(i => ({ ...i, product: i.product || '' })));
        setDiscountType(inv.discountType || 'percentage');
        setDiscountValue(inv.discountValue || 0);
        setPaymentType(inv.paymentType || 'Cash');
        setAdvancePayment(inv.advancePayment || 0);
        setInvoiceDate(formatDateInput(inv.invoiceDate));
        setDeliveryDate(inv.deliveryDate ? formatDateInput(inv.deliveryDate) : '');
        setNotes(inv.notes || '');
        setTerms(inv.terms || '');
      });
    }
  }, [id, isEdit]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + (i.lineTotal || 0), 0), [items]);

  const discountAmount = useMemo(() => {
    let amt = discountType === 'percentage' ? subtotal * ((discountValue || 0) / 100) : (discountValue || 0);
    return Math.round(amt * 100) / 100;
  }, [subtotal, discountType, discountValue]);

  const grandTotal = useMemo(() => Math.round((subtotal - discountAmount) * 100) / 100, [subtotal, discountAmount]);

  const handleItemChange = (index, updated) => {
    const newItems = [...items];
    newItems[index] = updated;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (index) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const handleSubmit = async (status = 'Draft') => {
    if (!customerId) return toast.error('Please select a customer');
    if (!items.some(i => i.name && i.quantity > 0)) return toast.error('Add at least one item');

    setSaving(true);
    try {
      const data = {
        customer: customerId,
        items: items.filter(i => i.name).map(i => ({
          product: i.product || undefined,
          name: i.name,
          category: i.category,
          orderType: i.orderType,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount) || 0
        })),
        discountType, discountValue,
        paymentType, invoiceDate,
        deliveryDate: deliveryDate || undefined,
        advancePayment: Number(advancePayment) || 0,
        notes, terms
      };

      if (isEdit) {
        await updateInvoice(id, data);
        toast.success('Invoice updated');
      } else {
        const res = await createInvoice(data);
        toast.success(`Invoice ${res.data.invoiceNumber} created`);
      }
      navigate('/invoices');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleNewCustomer = async (data) => {
    try {
      const res = await createCustomer(data);
      setCustomerId(res.data._id);
      setCustomerData(res.data);
      setShowCustomerForm(false);
      toast.success('Customer created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Row className="g-4">
      <Col lg={8}>
        <div className="card-custom mb-4">
          <h5 className="form-section-title">Customer</h5>
          <CustomerSelect
            value={customerId}
            onChange={(id, data) => { setCustomerId(id); setCustomerData(data); }}
            onAddNew={() => setShowCustomerForm(true)}
          />
          {customerData && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--tint)', borderRadius: 8, fontSize: '0.82rem', color: '#666' }}>
              {customerData.address && <div>{customerData.address}</div>}
              {customerData.email && <div>{customerData.email}</div>}
              {customerData.company && <div>Company: {customerData.company}</div>}
            </div>
          )}
        </div>

        <div className="card-custom mb-4">
          <h5 className="form-section-title">Invoice Details</h5>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Invoice Date</Form.Label>
                <Form.Control className="form-input" type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Delivery Date</Form.Label>
                <Form.Control className="form-input" type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Payment Type</Form.Label>
                <Form.Select className="form-input" value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                  {PAYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="card-custom mb-4">
          <h5 className="form-section-title">Items</h5>
          <div style={{ overflowX: 'auto' }}>
            <table className="items-table">
              <thead>
                <tr>
                  <th>Product / Service</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Disc %</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <LineItemRow key={i} item={item} index={i} products={products} onChange={handleItemChange} onRemove={removeItem} />
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="link" onClick={addItem} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none', padding: 0, marginTop: '0.75rem' }}>
            <PlusIcon style={{ width: 16, height: 16, marginRight: 4 }} /> Add Item
          </Button>

          <div style={{ marginTop: '1.5rem' }}>
            <InvoiceSummary
              subtotal={subtotal}
              discountType={discountType}
              discountValue={discountValue}
              onDiscountTypeChange={setDiscountType}
              onDiscountValueChange={setDiscountValue}
              advancePayment={advancePayment}
              onAdvanceChange={setAdvancePayment}
            />
          </div>
        </div>

        <div className="card-custom mb-4">
          <h5 className="form-section-title">Notes & Terms</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Notes</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your business!" />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Terms & Conditions</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={3} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Payment terms..." />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <Button className="btn-primary-custom" onClick={() => handleSubmit()} disabled={saving}>{saving ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Create Invoice')}</Button>
          <Button variant="outline-secondary" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </Col>

      <Col lg={4} className="d-none d-lg-block">
        <InvoicePreview
          customer={customerData}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          grandTotal={grandTotal}
          invoiceDate={invoiceDate}
          deliveryDate={deliveryDate}
        />
      </Col>

      <CustomerForm show={showCustomerForm} onHide={() => setShowCustomerForm(false)} onSave={handleNewCustomer} customer={null} />
    </Row>
  );
}
