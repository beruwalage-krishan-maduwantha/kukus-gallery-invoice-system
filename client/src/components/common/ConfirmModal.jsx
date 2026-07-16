import { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({ show, onHide, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!show) setBusy(false); }, [show]);

  const handleConfirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide} disabled={busy}>Cancel</Button>
        <Button className={`btn-${variant}`} onClick={handleConfirm} disabled={busy}>
          {busy ? 'Please wait...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
