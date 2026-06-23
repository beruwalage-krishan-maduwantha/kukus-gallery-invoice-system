import { Modal, Button } from 'react-bootstrap';

export default function ConfirmModal({ show, onHide, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button className={`btn-${variant}`} onClick={onConfirm}>{confirmText}</Button>
      </Modal.Footer>
    </Modal>
  );
}
