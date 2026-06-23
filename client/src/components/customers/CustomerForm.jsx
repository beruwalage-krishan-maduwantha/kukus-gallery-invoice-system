import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';

const emptyForm = { name: '', email: '', phone: '', address: '', company: '', notes: '' };

export default function CustomerForm({ show, onHide, onSave, customer }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(customer ? { name: customer.name || '', email: customer.email || '', phone: customer.phone || '', address: customer.address || '', company: customer.company || '', notes: customer.notes || '' } : emptyForm);
  }, [customer, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom">{customer ? 'Edit Customer' : 'New Customer'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Name *</Form.Label>
                <Form.Control className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Phone *</Form.Label>
                <Form.Control className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Email</Form.Label>
                <Form.Control className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Company</Form.Label>
                <Form.Control className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Address</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Notes</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary-custom">Save Customer</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
