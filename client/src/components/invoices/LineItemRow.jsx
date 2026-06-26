import { Form } from 'react-bootstrap';
import { TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/formatCurrency';
import api from '../../api/axios';

export default function LineItemRow({ item, index, products, onChange, onRemove }) {
  const handleChange = async (field, value) => {
    const updated = { ...item, [field]: value };
    if (field === 'product' && value) {
      const p = products.find(p => p._id === value);
      if (p) {
        updated.name = p.name;
        updated.category = p.category;
        updated.unitPrice = p.defaultPrice;
        const isSample = p.category === 'Sample' || p.category === 'Sample Development';
        updated.orderType = isSample ? 'Sample' : 'Bulk';
        try {
          const res = await api.get(`/invoices/next-order-number/${isSample ? 'sm' : 'blk'}`);
          updated.orderNumber = res.data.orderNumber;
        } catch { updated.orderNumber = isSample ? 'SM---' : 'BLK---'; }
      }
    }
    const qty = Number(updated.quantity) || 0;
    const price = Number(updated.unitPrice) || 0;
    const disc = Number(updated.discount) || 0;
    updated.lineTotal = Math.round(qty * price * (1 - disc / 100) * 100) / 100;
    onChange(index, updated);
  };

  return (
    <tr>
      <td style={{ width: '30%' }}>
        <Form.Select size="sm" value={item.product || ''} onChange={e => handleChange('product', e.target.value)}>
          <option value="">-- Select Product --</option>
          {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Form.Select>
        {!item.product && (
          <Form.Control size="sm" className="mt-1" placeholder="Or type name..." value={item.name || ''} onChange={e => handleChange('name', e.target.value)} />
        )}
      </td>
      <td style={{ width: '10%', textAlign: 'center' }}>
        {item.orderNumber ? (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: item.orderType === 'Sample' ? 'var(--primary)' : 'var(--info)', background: item.orderType === 'Sample' ? 'rgba(177,145,198,0.12)' : 'rgba(59,130,246,0.1)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
            {item.orderNumber}
          </span>
        ) : <span style={{ color: '#ccc', fontSize: '0.75rem' }}>—</span>}
      </td>
      <td style={{ width: '10%' }}>
        <Form.Control size="sm" type="number" min="1" value={item.quantity || ''} onChange={e => handleChange('quantity', e.target.value)} />
      </td>
      <td style={{ width: '14%' }}>
        <Form.Control size="sm" type="number" min="0" step="0.01" value={item.unitPrice || ''} onChange={e => handleChange('unitPrice', e.target.value)} />
      </td>
      <td style={{ width: '10%' }}>
        <Form.Control size="sm" type="number" min="0" max="100" value={item.discount || ''} onChange={e => handleChange('discount', e.target.value)} placeholder="0" />
      </td>
      <td style={{ width: '14%', fontWeight: 600, color: 'var(--primary-dark)' }}>
        {formatCurrency(item.lineTotal || 0)}
      </td>
      <td style={{ width: '5%' }}>
        <button type="button" className="remove-item-btn" onClick={() => onRemove(index)}>
          <TrashIcon style={{ width: 18, height: 18 }} />
        </button>
      </td>
    </tr>
  );
}
