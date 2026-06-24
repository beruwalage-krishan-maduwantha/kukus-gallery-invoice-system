import { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CircleStackIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import api from '../api/axios';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    Promise.all([
      getSettings(),
      api.get('/backup/stats')
    ]).then(([setRes, statsRes]) => {
      setForm(setRes.data);
      setDbStats(statsRes.data);
    }).catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings(form);
      setForm(res.data);
      toast.success('Settings saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/backup/export');
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kukus_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded!');
    } catch { toast.error('Backup failed'); }
    finally { setExporting(false); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.data) {
        toast.error('Invalid backup file');
        return;
      }

      const res = await api.post('/backup/import', { data: backup.data });
      const r = res.data.results;
      toast.success(`Restored: ${r.customers} customers, ${r.products} products, ${r.invoices} invoices, ${r.quotations} quotations, ${r.creditNotes} credit notes`);

      const statsRes = await api.get('/backup/stats');
      setDbStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed — check file format');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading || !form) return <LoadingSpinner />;

  const update = (field, value) => setForm({ ...form, [field]: value });
  const updateBank = (field, value) => setForm({ ...form, bankDetails: { ...form.bankDetails, [field]: value } });

  return (
    <div>
      <Form onSubmit={handleSave}>
        <div className="card-custom mb-4">
          <h5 className="form-section-title">Company Information</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Company Name</Form.Label>
                <Form.Control className="form-input" value={form.companyName} onChange={e => update('companyName', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Tagline</Form.Label>
                <Form.Control className="form-input" value={form.tagline} onChange={e => update('tagline', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Address</Form.Label>
                <Form.Control className="form-input" value={form.address} onChange={e => update('address', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Phone</Form.Label>
                <Form.Control className="form-input" value={form.phone} onChange={e => update('phone', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Landline</Form.Label>
                <Form.Control className="form-input" value={form.landline} onChange={e => update('landline', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="form-label-custom">Email</Form.Label>
                <Form.Control className="form-input" type="email" value={form.email} onChange={e => update('email', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Website</Form.Label>
                <Form.Control className="form-input" value={form.website} onChange={e => update('website', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Invoice Prefix</Form.Label>
                <Form.Control className="form-input" value={form.invoicePrefix} onChange={e => update('invoicePrefix', e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="card-custom mb-4">
          <h5 className="form-section-title">Invoice Defaults</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Default Notes</Form.Label>
                <Form.Control className="form-input" value={form.defaultNotes} onChange={e => update('defaultNotes', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Default Terms</Form.Label>
                <Form.Control className="form-input" value={form.defaultTerms} onChange={e => update('defaultTerms', e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <div className="card-custom mb-4">
          <h5 className="form-section-title">Bank Details</h5>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Bank Name</Form.Label>
                <Form.Control className="form-input" value={form.bankDetails?.bankName || ''} onChange={e => updateBank('bankName', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Account Name</Form.Label>
                <Form.Control className="form-input" value={form.bankDetails?.accountName || ''} onChange={e => updateBank('accountName', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Account Number</Form.Label>
                <Form.Control className="form-input" value={form.bankDetails?.accountNumber || ''} onChange={e => updateBank('accountNumber', e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Branch Code</Form.Label>
                <Form.Control className="form-input" value={form.bankDetails?.branchCode || ''} onChange={e => updateBank('branchCode', e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </div>

        <Button type="submit" className="btn-primary-custom mb-4" disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Form>

      {/* Backup & Restore Section */}
      <div className="card-custom mb-4">
        <h5 className="form-section-title">
          <CircleStackIcon style={{ width: 20, height: 20, marginRight: 8, display: 'inline' }} />
          Backup & Restore
        </h5>

        {dbStats && (
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              { label: 'Customers', count: dbStats.customers },
              { label: 'Products', count: dbStats.products },
              { label: 'Invoices', count: dbStats.invoices },
              { label: 'Quotations', count: dbStats.quotations },
              { label: 'Credit Notes', count: dbStats.creditNotes }
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--tint)', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-dark)' }}>{item.count}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{item.label}</div>
              </div>
            ))}
            <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--info)' }}>{dbStats.totalDocuments}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--info)' }}>Total</div>
            </div>
          </div>
        )}

        <Row className="g-3">
          <Col md={6}>
            <div style={{ background: 'var(--tint)', padding: '1.5rem', borderRadius: 12, textAlign: 'center' }}>
              <ArrowDownTrayIcon style={{ width: 32, height: 32, color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h6 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>Download Backup</h6>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '1rem' }}>
                Export all data (customers, products, invoices, quotations, credit notes) as a JSON file.
              </p>
              <Button className="btn-primary-custom" onClick={handleExport} disabled={exporting}>
                <ArrowDownTrayIcon style={{ width: 16, height: 16, marginRight: 6 }} />
                {exporting ? 'Exporting...' : 'Download Backup'}
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <div style={{ background: 'var(--tint)', padding: '1.5rem', borderRadius: 12, textAlign: 'center' }}>
              <ArrowUpTrayIcon style={{ width: 32, height: 32, color: 'var(--warning)', marginBottom: '0.75rem' }} />
              <h6 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>Restore Backup</h6>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '1rem' }}>
                Upload a backup JSON file to restore missing data. Existing records won't be duplicated.
              </p>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
              <Button className="btn-outline-custom" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                <ArrowUpTrayIcon style={{ width: 16, height: 16, marginRight: 6 }} />
                {importing ? 'Restoring...' : 'Upload & Restore'}
              </Button>
            </div>
          </Col>
        </Row>

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: 8, fontSize: '0.75rem', color: '#92400E' }}>
          <strong>Tip:</strong> Download a backup regularly to keep your data safe. Restore only adds missing records — it won't overwrite or duplicate existing data.
        </div>
      </div>
    </div>
  );
}
