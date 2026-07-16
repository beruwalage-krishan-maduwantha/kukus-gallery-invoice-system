import { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { SIZE_CHARTS, emptySizeValues } from '../../utils/sizeCharts';

export const TRIM_ITEMS = ['Label', 'Hang Tag', 'Button', 'Zipper', 'Thread', 'Elastic', 'Other'];
const newMaterialRow = (sizeType = 'women') => ({
  matIndex: null,
  existingFilename: null,
  previewUrl: null,
  newFile: null,
  removeImage: false,
  sizes: emptySizeValues(sizeType)
});

const newBlock = () => ({
  designIndex: null,
  existingDesignImages: [], // [{index, filename, previewUrl}]
  removedDesignIndexes: [],
  newDesignImages: [], // [{name, type, data, previewUrl}]
  sizeType: 'women',
  materials: [newMaterialRow('women')],
  notes: ''
});

function ImageThumb({ src, loading, onRemove }) {
  return (
    <div style={{ position: 'relative' }}>
      {src
        ? <img src={src} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
        : <div style={{ width: 84, height: 84, borderRadius: 8, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', color: 'var(--muted-ink)' }}>{loading ? 'Loading…' : ''}</div>
      }
      <button type="button" onClick={onRemove}
        style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.7rem', lineHeight: '20px', textAlign: 'center', padding: 0 }}>×</button>
    </div>
  );
}

export default function JobSheetModal({ order, show, onHide, onSaved }) {
  const [blocks, setBlocks] = useState([newBlock()]);
  const [trims, setTrims] = useState([{ item: '', quantity: '', custom: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show || !order) return;
    const js = order.jobSheet || {};

    setTrims(js.trims?.length ? js.trims.map(t => ({
      item: TRIM_ITEMS.includes(t.item) ? t.item : (t.item ? 'Other' : ''),
      quantity: t.quantity || '',
      custom: TRIM_ITEMS.includes(t.item) ? '' : (t.item || '')
    })) : [{ item: '', quantity: '', custom: '' }]);

    const designs = js.designs?.length ? js.designs : [];
    if (!designs.length) {
      setBlocks([newBlock()]);
      return;
    }

    setBlocks(designs.map(d => {
      const sizeType = d.sizeType === 'kids' ? 'kids' : 'women';
      // migrate legacy single-material designs into one table row
      const mats = d.materials?.length
        ? d.materials
        : ((d.materialImage?.filename || Object.values(d.sizeBreakdown || {}).some(v => Number(v)))
            ? [{ index: 0, image: d.materialImage, sizes: d.sizeBreakdown || {} }]
            : []);
      return {
        designIndex: d.designIndex,
        existingDesignImages: (d.designImages || []).map(img => ({ index: img.index, filename: img.filename, previewUrl: null })),
        removedDesignIndexes: [],
        newDesignImages: [],
        sizeType,
        materials: mats.length ? mats.map(m => ({
          matIndex: m.index ?? 0,
          existingFilename: m.image?.filename || null,
          previewUrl: null,
          newFile: null,
          removeImage: false,
          sizes: {
            ...emptySizeValues(sizeType),
            ...Object.fromEntries(Object.entries(m.sizes || {}).map(([k, v]) => [k, v || '']))
          }
        })) : [newMaterialRow(sizeType)],
        notes: d.notes || ''
      };
    }));

    // fetch previews
    designs.forEach(d => {
      (d.designImages || []).forEach(img => {
        api.get(`/orders/${order._id}/jobsheet-image/design/${d.designIndex}/${img.index}`, { responseType: 'blob' })
          .then(res => {
            const url = URL.createObjectURL(res.data);
            setBlocks(prev => prev.map(b => b.designIndex === d.designIndex
              ? { ...b, existingDesignImages: b.existingDesignImages.map(e => e.index === img.index ? { ...e, previewUrl: url } : e) }
              : b));
          }).catch(() => {});
      });
      const matsForPreview = d.materials?.length
        ? d.materials
        : (d.materialImage?.filename ? [{ index: 0, image: d.materialImage }] : []);
      matsForPreview.forEach(m => {
        if (!m.image?.filename) return;
        api.get(`/orders/${order._id}/jobsheet-image/material/${d.designIndex}/${m.index ?? 0}`, { responseType: 'blob' })
          .then(res => {
            const url = URL.createObjectURL(res.data);
            setBlocks(prev => prev.map(b => b.designIndex === d.designIndex
              ? { ...b, materials: b.materials.map(row => row.matIndex === (m.index ?? 0) ? { ...row, previewUrl: url } : row) }
              : b));
          }).catch(() => {});
      });
    });
  }, [show, order]);

  const updateBlock = (i, patch) => setBlocks(prev => prev.map((b, x) => x === i ? { ...b, ...patch } : b));

  const pickDesignFiles = (blockIdx) => (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (file.size > 4 * 1024 * 1024) { toast.error(`${file.name} is too large — maximum 4 MB`); return; }
      const reader = new FileReader();
      reader.onload = () => {
        setBlocks(prev => prev.map((b, x) => x === blockIdx
          ? { ...b, newDesignImages: [...b.newDesignImages, { name: file.name, type: file.type || 'image/jpeg', data: String(reader.result).split(',')[1], previewUrl: String(reader.result) }] }
          : b));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const updateMaterial = (blockIdx, matIdx, patch) =>
    setBlocks(prev => prev.map((b, x) => x === blockIdx
      ? { ...b, materials: b.materials.map((m, mx) => mx === matIdx ? { ...m, ...patch } : m) }
      : b));

  const pickMaterialImage = (blockIdx, matIdx) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too large — maximum 4 MB'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      updateMaterial(blockIdx, matIdx, {
        newFile: { name: file.name, type: file.type || 'image/jpeg', data: String(reader.result).split(',')[1] },
        previewUrl: String(reader.result),
        removeImage: false
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const designs = blocks.map(b => ({
        designIndex: b.designIndex,
        removeDesignImageIndexes: b.removedDesignIndexes,
        newDesignImages: b.newDesignImages.map(f => ({ name: f.name, type: f.type, data: f.data })),
        sizeType: b.sizeType,
        materials: b.materials.map(m => ({
          index: m.matIndex,
          image: m.newFile || undefined,
          removeImage: m.removeImage || undefined,
          sizes: m.sizes
        })),
        notes: b.notes
      }));
      await api.put(`/orders/${order._id}/jobsheet`, {
        jobSheet: {
          designs,
          trims: trims
            .filter(t => t.item)
            .map(t => ({ item: t.item === 'Other' ? (t.custom || '').trim() : t.item, quantity: t.quantity }))
        }
      });
      toast.success('Job sheet saved');
      onHide();
      onSaved?.();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save job sheet'); }
    finally { setSaving(false); }
  };

  if (!order) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="modal-title-custom" style={{ fontSize: '1.1rem' }}>
          Job Sheet — {order.orderNumber} ({order.orderType}) — {order.productName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {blocks.map((b, i) => {
          const visibleExisting = b.existingDesignImages.filter(d => !b.removedDesignIndexes.includes(d.index));
          return (
            <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '1rem', marginBottom: '1rem', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary-dark)' }}>{order.orderNumber}-{i + 1}</strong>
                {blocks.length > 1 && (
                  <button type="button" className="remove-item-btn" onClick={() => setBlocks(prev => prev.filter((_, x) => x !== i))}>
                    <TrashIcon style={{ width: 16, height: 16 }} />
                  </button>
                )}
              </div>
              <Row className="g-3">
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="form-label-custom">Design Images</Form.Label>
                    <Form.Control className="form-input" type="file" accept="image/*" multiple onChange={pickDesignFiles(i)} />
                    {(visibleExisting.length > 0 || b.newDesignImages.length > 0) && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.6rem' }}>
                        {visibleExisting.map(d => (
                          <ImageThumb key={`existing-${d.index}`} src={d.previewUrl} loading={!d.previewUrl}
                            onRemove={() => updateBlock(i, { removedDesignIndexes: [...b.removedDesignIndexes, d.index] })} />
                        ))}
                        {b.newDesignImages.map((f, fi) => (
                          <ImageThumb key={`new-${fi}`} src={f.previewUrl}
                            onRemove={() => updateBlock(i, { newDesignImages: b.newDesignImages.filter((_, x) => x !== fi) })} />
                        ))}
                      </div>
                    )}
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Form.Label className="form-label-custom" style={{ marginBottom: 0 }}>Size Break Down (Material x Sizes)</Form.Label>
                    <Form.Select size="sm" style={{ maxWidth: 140 }} value={b.sizeType}
                      onChange={e => {
                        const nextType = e.target.value === 'kids' ? 'kids' : 'women';
                        setBlocks(prev => prev.map((blk, x) => x === i
                          ? { ...blk, sizeType: nextType, materials: blk.materials.map(m => ({ ...m, sizes: emptySizeValues(nextType) })) }
                          : blk));
                      }}>
                      <option value="women">Women</option>
                      <option value="kids">Kids</option>
                    </Form.Select>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="items-table" style={{ minWidth: 620 }}>
                      <thead>
                        <tr>
                          <th style={{ minWidth: 110 }}>Material</th>
                          {SIZE_CHARTS[b.sizeType].map(({ key, label }) => (
                            <th key={key} style={{ textAlign: 'center', fontSize: '0.6rem', minWidth: 52 }}>{label}</th>
                          ))}
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.materials.map((m, mi) => (
                          <tr key={mi}>
                            <td>
                              {m.previewUrl && !m.removeImage ? (
                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                  <img src={m.previewUrl} alt="Material" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />
                                  <button type="button"
                                    onClick={() => updateMaterial(i, mi, { previewUrl: null, newFile: null, removeImage: !!m.existingFilename })}
                                    style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.65rem', lineHeight: '18px', textAlign: 'center', padding: 0 }}>x</button>
                                </div>
                              ) : (
                                <Form.Control size="sm" type="file" accept="image/*" style={{ maxWidth: 130, fontSize: '0.65rem' }} onChange={pickMaterialImage(i, mi)} />
                              )}
                            </td>
                            {SIZE_CHARTS[b.sizeType].map(({ key }) => (
                              <td key={key} style={{ width: 54 }}>
                                <Form.Control size="sm" type="number" min="0" value={m.sizes[key] || ''}
                                  onChange={e => updateMaterial(i, mi, { sizes: { ...m.sizes, [key]: e.target.value } })} placeholder="0" />
                              </td>
                            ))}
                            <td>
                              <button type="button" className="remove-item-btn"
                                onClick={() => setBlocks(prev => prev.map((blk, x) => x === i
                                  ? { ...blk, materials: blk.materials.length > 1 ? blk.materials.filter((_, mx) => mx !== mi) : [newMaterialRow(blk.sizeType)] }
                                  : blk))}>
                                <TrashIcon style={{ width: 15, height: 15 }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="link"
                    onClick={() => setBlocks(prev => prev.map((blk, x) => x === i ? { ...blk, materials: [...blk.materials, newMaterialRow(blk.sizeType)] } : blk))}
                    style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.78rem', textDecoration: 'none', padding: 0, marginTop: '0.4rem' }}>
                    <PlusIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Add Material
                  </Button>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="form-label-custom">Notes</Form.Label>
                    <Form.Control className="form-input" as="textarea" rows={2} value={b.notes}
                      onChange={e => updateBlock(i, { notes: e.target.value })} placeholder="Special instructions, measurements, client requests..." />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          );
        })}
        <Button variant="link" onClick={() => setBlocks([...blocks, newBlock()])} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', padding: 0, marginBottom: '1.25rem' }}>
          <PlusIcon style={{ width: 15, height: 15, marginRight: 4 }} /> Add Design
        </Button>

        <Row className="g-3">
          <Col xs={12}>
            <Form.Label className="form-label-custom">Trims & Accessories</Form.Label>
            {trims.map((t, i) => (
              <div key={i} className="d-flex gap-2 align-items-center" style={{ marginBottom: '0.5rem' }}>
                <Form.Select size="sm" style={{ maxWidth: 200 }} value={t.item}
                  onChange={e => { const next = [...trims]; next[i] = { ...next[i], item: e.target.value }; setTrims(next); }}>
                  <option value="">Select item...</option>
                  {TRIM_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                </Form.Select>
                {t.item === 'Other' && (
                  <Form.Control size="sm" style={{ maxWidth: 180 }} value={t.custom} placeholder="Type item name"
                    onChange={e => { const next = [...trims]; next[i] = { ...next[i], custom: e.target.value }; setTrims(next); }} />
                )}
                <Form.Control size="sm" style={{ maxWidth: 240 }} value={t.quantity} placeholder="Qty / details"
                  onChange={e => { const next = [...trims]; next[i] = { ...next[i], quantity: e.target.value }; setTrims(next); }} />
                <button type="button" className="remove-item-btn" onClick={() => trims.length > 1 ? setTrims(trims.filter((_, x) => x !== i)) : setTrims([{ item: '', quantity: '', custom: '' }])}>
                  <TrashIcon style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ))}
            <Button variant="link" onClick={() => setTrims([...trims, { item: '', quantity: '', custom: '' }])} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none', padding: 0 }}>
              <PlusIcon style={{ width: 15, height: 15, marginRight: 4 }} /> Add Trim / Accessory
            </Button>
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
