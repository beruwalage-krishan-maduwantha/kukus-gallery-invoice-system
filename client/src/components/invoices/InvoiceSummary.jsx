import { Form } from 'react-bootstrap';
import { formatCurrency } from '../../utils/formatCurrency';

export default function InvoiceSummary({ subtotal, discountType, discountValue, onDiscountTypeChange, onDiscountValueChange, advancePayment, onAdvanceChange }) {
  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * ((discountValue || 0) / 100);
  } else {
    discountAmount = discountValue || 0;
  }
  discountAmount = Math.round(discountAmount * 100) / 100;
  const afterDiscount = Math.round((subtotal - discountAmount) * 100) / 100;
  const advance = Number(advancePayment) || 0;
  const grandTotal = Math.round((afterDiscount - advance) * 100) / 100;

  return (
    <div className="invoice-summary">
      <div className="summary-row">
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="summary-row" style={{ gap: '0.5rem', alignItems: 'center' }}>
        <span>Discount</span>
        <div className="d-flex align-items-center gap-2" style={{ marginLeft: 'auto' }}>
          <Form.Select size="sm" value={discountType} onChange={e => onDiscountTypeChange(e.target.value)} style={{ width: 90, fontSize: '0.78rem' }}>
            <option value="percentage">%</option>
            <option value="fixed">Fixed</option>
          </Form.Select>
          <Form.Control size="sm" type="number" min="0" value={discountValue || ''} onChange={e => onDiscountValueChange(Number(e.target.value))} style={{ width: 80, fontSize: '0.82rem' }} placeholder="0" />
        </div>
      </div>
      {discountAmount > 0 && (
        <div className="summary-row" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
          <span></span>
          <span>- {formatCurrency(discountAmount)}</span>
        </div>
      )}
      {onAdvanceChange && (
        <div className="summary-row" style={{ gap: '0.5rem', alignItems: 'center' }}>
          <span>Advance</span>
          <Form.Control size="sm" type="number" min="0" step="0.01" value={advancePayment || ''} onChange={e => onAdvanceChange(Number(e.target.value))} style={{ width: 120, fontSize: '0.82rem', marginLeft: 'auto' }} placeholder="0.00" />
        </div>
      )}
      {advance > 0 && (
        <div className="summary-row" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
          <span></span>
          <span>- {formatCurrency(advance)}</span>
        </div>
      )}
      <div className="summary-row total">
        <span>Grand Total</span>
        <span>{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}
