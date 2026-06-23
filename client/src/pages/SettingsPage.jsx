import { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function SettingsPage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(res => setForm(res.data))
      .catch(() => toast.error('Failed to load settings'))
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

  if (loading || !form) return <LoadingSpinner />;

  const update = (field, value) => setForm({ ...form, [field]: value });
  const updateBank = (field, value) => setForm({ ...form, bankDetails: { ...form.bankDetails, [field]: value } });

  return (
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
              <Form.Label className="form-label-custom">Default Payment Terms</Form.Label>
              <Form.Select className="form-input" value={form.defaultPaymentTerms} onChange={e => update('defaultPaymentTerms', e.target.value)}>
                <option>Due on Receipt</option>
                <option>Net 15</option>
                <option>Net 30</option>
                <option>Net 45</option>
                <option>Net 60</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label className="form-label-custom">Default Notes</Form.Label>
              <Form.Control className="form-input" value={form.defaultNotes} onChange={e => update('defaultNotes', e.target.value)} />
            </Form.Group>
          </Col>
          <Col xs={12}>
            <Form.Group>
              <Form.Label className="form-label-custom">Default Terms & Conditions</Form.Label>
              <Form.Control className="form-input" as="textarea" rows={3} value={form.defaultTerms} onChange={e => update('defaultTerms', e.target.value)} />
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

      <Button type="submit" className="btn-primary-custom" disabled={saving}>
        {saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </Form>
  );
}
