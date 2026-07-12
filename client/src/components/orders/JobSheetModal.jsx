import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const TRIM_ITEMS = ['Label', 'Hang Tag', 'Button', 'Zipper', 'Thread', 'Elastic', 'Other'];

const emptyRow = { color: '', s: '', m: '', l: '', xl: '', xxl: '' };

function ImagePicker({ label, existing, preview, onPick, onRemove }) {
  return (
    <Form.Group>
      <Form.Label className="form-label-custom">{label}</Form.Label>
      <Form.Control className="form-input" type="file" accept="image/*" onChange={onPick} />
      {preview && (
        <div style={{ marginTop: '0.5rem' }}>
          <img src={preview} alt={label} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, border: '1px solid var(--line)' }} />
        </div>
      )}
      {existing && (
        <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: 'var(--muted-ink)', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{existing}</span>
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, padding: 0 }}>Remove</button>
        </div>
      )}
    </Form.Group>
  );
}

export default function JobSheetModal({ order, show, onHide, onSaved }) {
  const isSample = order?.orderType === 'Sample';
  const [sizeOption, setSizeOption] = useState('');
  const [rows, setRows] = useState([{ ...emptyRow }]);
  const [trims, setTrims] = useState(TRIM_ITEMS.map(item => ({ item, quantity: '' })));
  const [notes, setNotes] = useState('');
  const [designFile, setDesignFile] = useState(null);
  const [materialFile, setMaterialFile] = useState(null);
  const [designPreview, setDesignPreview] = useState(null);
  const [materialPreview, setMaterialPreview] = useState(null);
  const [removeDesign, setRemoveDesign] = useState(false);
  const [removeMaterial, setRemoveMaterial] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show || !order) return;
    const js = order.jobSheet || {};
    setSizeOption(js.sizeOption || '');
    setRows(js.sizeBreakdown?.length ? js.sizeBreakdown.map(r => ({ color: r.color, s: r.s || '', m: r.m || '', l: r.l || '', xl: r.xl || '', xxl: r.xxl || '' })) : [{ ...emptyRow }]);
    setTrims(TRIM_ITEMS.map(item => ({ item, quantity: js.trims?.find(t => t.item === item)?.quantity || '' })));
    setNotes(js.notes || '');
    setDesignFile(null); setMaterialFile(null);
    setDesignPreview(null); setMaterialPreview(null);
    setRemoveDesign(false); setRemoveMaterial(false);
    // load existing image previews
    ['design', 'material'].forEach(kind => {
      const meta = kind === 'design' ? js.designImage : js.materialImage;
      if (meta?.filename) {
        api.get(`/orders/${order._id}/jobsheet-image/${kind}`, { responseType: 'blob' })
          .then(res => {
            const url = URL.createObjectURL(res.data);
            kind === 'design' ? setDesignPreview(url) : setMaterialPreview(url);
          }).catch(() => {});
      }
    });
  }, [show, order]);

  const pickImage = (setFile, setPreview, setRemove) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too large — maximum 4 MB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ name: file.name, type: file.type || 'image/jpeg', data: String(reader.result).split(',')[1] });
      setPreview(String(reader.result));
      setRemove(false);
    };
    reader.readAsDataURL(file);
  };

  const updateRow = (i, field, value) => {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/orders/${order._id}/jobsheet`, {
        jobSheet: {
          sizeOption: isSample ? sizeOption : '',
          sizeBreakdown: isSample ? [] : rows,
          trims: isSample ? [] : trims,
          notes
        },
        designImage: designFile || undefined,
        materialImage: materialFile || undefined,
        removeDesignImage: removeDesign || undefined,
        removeMaterialImage: removeMaterial || undefined
      });
      toast.success('Job sheet saved');
      onHide();
      onSaved?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save job sheet'); }
    finally { setSaving(false); }
  };

  if (!order) return null;
  const js = order.jobSheet || {};

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom" style={{ fontSize: '1.1rem' }}>
          Job Sheet — {order.orderNumber} ({order.orderType}) — {order.productName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="g-3">
          <Col md={6}>
            <ImagePicker
              label="Design / Product Image"
              existing={!designFile && js.designImage?.filename && !removeDesign ? js.designImage.filename : null}
              preview={removeDesign ? null : designPreview}
              onPick={pickImage(setDesignFile, setDesignPreview, setRemoveDesign)}
              onRemove={() => { setRemoveDesign(true); setDesignPreview(null); }}
            />
          </Col>
          <Col md={6}>
            <ImagePicker
              label="Material Image"
              existing={!materialFile && js.materialImage?.filename && !removeMaterial ? js.materialImage.filename : null}
              preview={removeMaterial ? null : materialPreview}
              onPick={pickImage(setMaterialFile, setMaterialPreview, setRemoveMaterial)}
              onRemove={() => { setRemoveMaterial(true); setMaterialPreview(null); }}
            />
          </Col>

          {isSample ? (
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Size</Form.Label>
                <Form.Select className="form-input" value={sizeOption} onChange={e => setSizeOption(e.target.value)}>
                  <option value="">Select size type</option>
                  <option value="Standard Size">Standard Size</option>
                  <option value="Client Size">Client Size</option>
                </Form.Select>
              </Form.Group>
            </Col>
          ) : (
            <>
              <Col xs={12}>
                <Form.Label className="form-label-custom">Size Break Down (colors × sizes)</Form.Label>
                <div style={{ overflowX: 'auto' }}>
                  <table className="items-table" style={{ minWidth: 480 }}>
                    <thead>
                      <tr>
                        <th>Color / Material</th>
                        <th>S</th><th>M</th><th>L</th><th>XL</th><th>2XL</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ minWidth: 140 }}>
                            <Form.Control size="sm" value={r.color} onChange={e => updateRow(i, 'color', e.target.value)} placeholder="e.g. Black" />
                          </td>
                          {['s', 'm', 'l', 'xl', 'xxl'].map(f => (
                            <td key={f} style={{ width: 60 }}>
                              <Form.Control size="sm" type="number" min="0" value={r[f]} onChange={e => updateRow(i, f, e.target.value)} placeholder="0" />
                            </td>
                          ))}
                          <td>
                            <button type="button" className="remove-item-btn" onClick={() => rows.length > 1 && setRows(rows.filter((_, x) => x !== i))}>
                              <TrashIcon style={{ width: 16, height: 16 }} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Button variant="link" onClick={() => setRows([...rows, { ...emptyRow }])} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', padding: 0, marginTop: '0.4rem' }}>
                  <PlusIcon style={{ width: 15, height: 15, marginRight: 4 }} /> Add Color
                </Button>
              </Col>
              <Col xs={12}>
                <Form.Label className="form-label-custom">Trims & Accessories</Form.Label>
                <Row className="g-2">
                  {trims.map((t, i) => (
                    <Col xs={6} md={3} key={t.item}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginBottom: 2 }}>{t.item}</div>
                      <Form.Control size="sm" value={t.quantity} placeholder="Qty / details"
                        onChange={e => { const next = [...trims]; next[i] = { ...next[i], quantity: e.target.value }; setTrims(next); }} />
                    </Col>
                  ))}
                </Row>
              </Col>
            </>
          )}

          <Col xs={12}>
            <Form.Group>
              <Form.Label className="form-label-custom">Notes</Form.Label>
              <Form.Control className="form-input" as="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions, measurements, client requests..." />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
        <Button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Job Sheet'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
