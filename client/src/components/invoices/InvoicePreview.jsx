import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { BRAND } from '../../brand';

export default function InvoicePreview({ customer, items, subtotal, discountAmount, grandTotal, invoiceDate, deliveryDate }) {
  return (
    <div className="preview-panel">
      <h5 className="preview-title">Live Preview</h5>

      <div style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
        <strong style={{ color: 'var(--primary-dark)', fontSize: '0.8rem' }}>{BRAND.legalName}</strong>
      </div>

      {customer && (
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ color: 'var(--accent)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bill To</span>
          <br /><strong style={{ fontSize: '0.75rem' }}>{customer.name}</strong>
          {customer.phone && <br />}
          {customer.phone && <span style={{ fontSize: '0.65rem', color: 'var(--muted-ink)' }}>{customer.phone}</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--muted-ink)', marginBottom: '0.5rem' }}>
        <span>Date: {formatDate(invoiceDate)}</span>
        {deliveryDate && <span>Delivery: {formatDate(deliveryDate)}</span>}
      </div>

      {items.filter(i => i.name).length > 0 && (
        <table style={{ width: '100%', fontSize: '0.62rem', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--primary-dark)' }}>
              <th style={{ padding: '0.2rem', color: 'var(--primary-dark)' }}>Item</th>
              <th style={{ padding: '0.2rem', textAlign: 'center' }}>Type</th>
              <th style={{ padding: '0.2rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.filter(i => i.name).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '0.2rem' }}>
  <div>
    {item.name}{' '}
    <span style={{ color: 'var(--soft-ink)' }}>
      x{item.quantity}
    </span>
  </div>

  {item.description && (
    <div
      style={{
        marginTop: '2px',
        fontSize: '0.55rem',
        lineHeight: 1.3,
        color: 'var(--muted-ink)',
        whiteSpace: 'pre-line'
      }}
    >
      {item.description}
    </div>
  )}
</td>
                <td style={{ padding: '0.2rem', textAlign: 'center' }}>{item.orderType}</td>
                <td style={{ padding: '0.2rem', textAlign: 'right' }}>{formatCurrency(item.lineTotal || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ borderTop: '1px solid var(--primary)', paddingTop: '0.3rem', textAlign: 'right' }}>
        {discountAmount > 0 && (
          <div style={{ fontSize: '0.62rem', color: 'var(--danger)' }}>Discount: -{formatCurrency(discountAmount)}</div>
        )}
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-dark)' }}>
          Total: {formatCurrency(grandTotal)}
        </div>
      </div>
    </div>
  );
}
