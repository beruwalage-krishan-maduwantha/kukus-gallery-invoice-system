import { useState, useEffect, useRef } from 'react';
import { getCustomers } from '../../api/customers';

export default function CustomerSelect({ value, onChange, onAddNew }) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState(null);
  const wrapperRef = useRef();

  useEffect(() => {
    if (value && !selected) {
      getCustomers({ search: '', limit: 100 }).then(res => {
        const found = res.data.customers.find(c => c._id === value);
        if (found) setSelected(found);
      });
    }
  }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = async (term) => {
    setSearch(term);
    if (term.length >= 1) {
      const res = await getCustomers({ search: term, limit: 10 });
      setOptions(res.data.customers);
      setShowDropdown(true);
    } else {
      const res = await getCustomers({ limit: 10 });
      setOptions(res.data.customers);
      setShowDropdown(true);
    }
  };

  const handleSelect = (customer) => {
    setSelected(customer);
    setSearch('');
    setShowDropdown(false);
    onChange(customer._id, customer);
  };

  const handleClear = () => {
    setSelected(null);
    setSearch('');
    onChange('', null);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {selected ? (
        <div className="form-input d-flex justify-content-between align-items-center">
          <div>
            <strong>{selected.name}</strong>
            <span style={{ color: '#999', marginLeft: '0.5rem', fontSize: '0.82rem' }}>{selected.phone}</span>
          </div>
          <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
        </div>
      ) : (
        <input
          type="text"
          className="form-control form-input"
          placeholder="Search customer by name, phone, or company..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => handleSearch(search)}
        />
      )}
      {showDropdown && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#fff', border: '1px solid rgba(177,145,198,0.2)', borderRadius: '0 0 8px 8px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', maxHeight: 260, overflowY: 'auto' }}>
          <div onClick={onAddNew} style={{ position: 'sticky', top: 0, padding: '0.6rem 1rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: '0.82rem', borderBottom: '1px solid #eee', background: '#fff' }}>
            + Add New Customer
          </div>
          {options.map(c => (
            <div key={c._id} onClick={() => handleSelect(c)} style={{ padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0', fontSize: '0.85rem', transition: 'background 0.15s' }} onMouseEnter={e => e.target.style.background = 'var(--tint)'} onMouseLeave={e => e.target.style.background = '#fff'}>
              <strong>{c.name}</strong>{c.company && <span style={{ color: '#999' }}> — {c.company}</span>}
              <br /><span style={{ color: '#999', fontSize: '0.78rem' }}>{c.phone} {c.email && `| ${c.email}`}</span>
            </div>
          ))}
          {options.length === 0 && <div style={{ padding: '0.8rem 1rem', color: '#999', fontSize: '0.85rem' }}>No customers found</div>}
        </div>
      )}
    </div>
  );
}
