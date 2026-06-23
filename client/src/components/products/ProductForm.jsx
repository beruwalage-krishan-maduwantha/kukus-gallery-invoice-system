import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { ALL_CATEGORIES, UNITS, SERVICE_TYPES, CATEGORIES } from '../../utils/constants';

const emptyForm = { name: '', description: '', category: '', serviceType: '', defaultPrice: '', unit: 'piece' };

export default function ProductForm({ show, onHide, onSave, product }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(product ? {
      name: product.name || '', description: product.description || '',
      category: product.category || '', serviceType: product.serviceType || '',
      defaultPrice: product.defaultPrice || '', unit: product.unit || 'piece'
    } : emptyForm);
  }, [product, show]);

  const availableCategories = form.serviceType ? (CATEGORIES[form.serviceType] || []).concat(['Other']) : ALL_CATEGORIES;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, defaultPrice: Number(form.defaultPrice) });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom">{product ? 'Edit Product' : 'New Product'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Product Name *</Form.Label>
                <Form.Control className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Service Type *</Form.Label>
                <Form.Select className="form-input" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value, category: '' })} required>
                  <option value="">Select...</option>
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Category *</Form.Label>
                <Form.Select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
                  <option value="">Select...</option>
                  {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Default Price (LKR) *</Form.Label>
                <Form.Control className="form-input" type="number" min="0" step="0.01" value={form.defaultPrice} onChange={e => setForm({ ...form, defaultPrice: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Unit</Form.Label>
                <Form.Select className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Description</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary-custom">Save Product</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
