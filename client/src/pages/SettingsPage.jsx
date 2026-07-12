import { useState, useEffect, useRef } from 'react';
import { Form, Button, Row, Col, Modal } from 'react-bootstrap';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CircleStackIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BRAND } from '../brand';
import { SECTIONS } from '../utils/permissions';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMainAdmin = user?.email === BRAND.mainAdminEmail;
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef();
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'staff', jobRole: '' });
  const [showResetPw, setShowResetPw] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] });

  const fetchUsers = () => { if (isAdmin) api.get('/users').then(res => setUsers(res.data)).catch(() => {}); };
  const fetchRoles = () => { if (isAdmin) api.get('/roles').then(res => setRoles(res.data)).catch(() => {}); };

  useEffect(() => {
    const promises = [getSettings(), api.get('/backup/stats')];
    if (isAdmin) promises.push(api.get('/users'));

    Promise.all(promises).then(([setRes, statsRes, usersRes]) => {
      setForm(setRes.data);
      setDbStats(statsRes.data);
      if (usersRes) setUsers(usersRes.data);
      fetchRoles();
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
      toast.success(`Restored: ${r.customers} customers, ${r.products} products, ${r.invoices} invoices, ${r.orders || 0} orders, ${r.quotations} quotations, ${r.creditNotes} credit notes`);

      const statsRes = await api.get('/backup/stats');
      setDbStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed — check file format');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div>
        <div className="card-custom mb-4">
          <h5 className="form-section-title" style={{ margin: 0, border: 0, padding: 0, marginBottom: '1rem' }}>
            <UsersIcon style={{ width: 20, height: 20, marginRight: 8, display: 'inline' }} />
            My Account
          </h5>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--tint)', padding: '1rem 1.5rem', borderRadius: 10, flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.3rem' }}>Logged in as</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>{user?.email}</div>
            </div>
            <Button className="btn-outline-custom btn-sm-custom" onClick={() => { setShowResetPw({ _id: user?.id, name: user?.name, email: user?.email }); setNewPassword(''); }}>
              Change Password
            </Button>
          </div>
        </div>

        <Modal show={!!showResetPw} onHide={() => setShowResetPw(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="modal-title-custom">Change Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Label className="form-label-custom">New Password * (min 6 characters)</Form.Label>
              <Form.Control className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShowResetPw(null)}>Cancel</Button>
            <Button className="btn-primary-custom" onClick={async () => {
              if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
              try {
                await api.put('/auth/change-password', { newPassword });
                toast.success('Password changed!');
                setShowResetPw(null);
              } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
            }}>Change Password</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

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
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Default Notes</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={2} value={form.defaultNotes} onChange={e => update('defaultNotes', e.target.value)} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Default Terms & Conditions</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={12} value={form.defaultTerms} onChange={e => update('defaultTerms', e.target.value)} style={{ fontSize: '0.82rem', lineHeight: 1.7 }} />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">PDF Terms & Conditions Page</Form.Label>
                <Form.Control className="form-input" as="textarea" rows={12} value={form.pdfTerms || ''} onChange={e => update('pdfTerms', e.target.value)} style={{ fontSize: '0.82rem', lineHeight: 1.7 }} placeholder="Full Terms & Conditions text printed on the second page of PDF invoices and quotations. Leave empty to use the built-in default." />
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
              { label: 'Orders', count: dbStats.orders },
              { label: 'Expenses', count: dbStats.expenses },
              { label: 'Quotations', count: dbStats.quotations },
              { label: 'Credit Notes', count: dbStats.creditNotes }
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--tint)', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'center', minWidth: 90 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>{item.count}</div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)' }}>{item.label}</div>
              </div>
            ))}
            <div style={{ background: 'rgba(59,130,246,0.08)', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: 'var(--info)' }}>{dbStats.totalDocuments}</div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--info)' }}>Total</div>
            </div>
          </div>
        )}

        <Row className="g-3">
          <Col md={6}>
            <div style={{ background: 'var(--tint)', padding: '1.5rem', borderRadius: 12, textAlign: 'center' }}>
              <ArrowDownTrayIcon style={{ width: 32, height: 32, color: 'var(--primary)', marginBottom: '0.75rem' }} />
              <h6 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--primary-dark)' }}>Download Backup</h6>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-ink)', marginBottom: '1rem' }}>
                Export all data (customers, products, invoices, orders, quotations, credit notes) as a JSON file.
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
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-ink)', marginBottom: '1rem' }}>
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

      {/* User Management - visible to every admin; the main admin account stays protected */}
      {isAdmin ? (
        <>
        <div className="card-custom mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="form-section-title" style={{ margin: 0, border: 0, padding: 0 }}>
              <UsersIcon style={{ width: 20, height: 20, marginRight: 8, display: 'inline' }} />
              User Management
            </h5>
            <Button className="btn-primary-custom btn-sm-custom" onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', password: '', role: 'staff', jobRole: '' }); setShowUserForm(true); }}>
              <PlusIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Add User
            </Button>
          </div>
          <div className="table-custom" style={{ boxShadow: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="status-badge" style={{
                        background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(177,145,198,0.12)',
                        color: u.role === 'admin' ? '#6366F1' : 'var(--accent)'
                      }}>{u.role === 'admin' ? 'admin' : (u.jobRole?.name || 'staff')}</span>
                    </td>
                    <td>
                      <span className="status-badge" style={{
                        background: u.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: u.isActive ? 'var(--success)' : 'var(--danger)'
                      }}>{u.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn-outline-custom btn-sm-custom" onClick={() => {
                          setEditingUser(u);
                          setUserForm({ name: u.name, email: u.email, password: '', role: u.role, jobRole: u.jobRole?._id || '' });
                          setShowUserForm(true);
                        }}>Edit</button>
                        <button className="btn-sm-custom" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => { setShowResetPw(u); setNewPassword(''); }}>Reset PW</button>
                        {u.email !== BRAND.mainAdminEmail && (
                          <button className="btn-sm-custom" style={{
                            background: u.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                            color: u.isActive ? 'var(--danger)' : 'var(--success)',
                            border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                          }} onClick={async () => {
                            try {
                              await api.put(`/users/${u._id}`, { isActive: !u.isActive });
                              toast.success(u.isActive ? 'User deactivated' : 'User activated');
                              fetchUsers();
                            } catch { toast.error('Failed'); }
                          }}>{u.isActive ? 'Deactivate' : 'Activate'}</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Roles */}
        <div className="card-custom mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="form-section-title" style={{ margin: 0, border: 0, padding: 0 }}>Job Roles</h5>
            <Button className="btn-primary-custom btn-sm-custom" onClick={() => { setEditingRole(null); setRoleForm({ name: '', permissions: [] }); setShowRoleForm(true); }}>
              <PlusIcon style={{ width: 14, height: 14, marginRight: 4 }} /> Add Role
            </Button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted-ink)', marginBottom: '0.75rem' }}>
            Create job roles (e.g. Production Manager, Accountant) and choose which sections each role can access. Assign a role when adding or editing a user.
          </p>
          {roles.length === 0 ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--soft-ink)' }}>No job roles yet — users with the basic Staff role see Quotations, Invoices, {BRAND.ordersLabel}, Customers and Expenses.</p>
          ) : (
            <div className="table-custom" style={{ boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr><th>Role</th><th>Can Access</th><th>Users</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {roles.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{r.name}</td>
                      <td style={{ fontSize: '0.78rem' }}>
                        {r.permissions.map(pk => SECTIONS.find(s => s.key === pk)?.label || pk).join(', ')}
                      </td>
                      <td>{r.usersCount}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button className="btn-outline-custom btn-sm-custom" onClick={() => { setEditingRole(r); setRoleForm({ name: r.name, permissions: [...r.permissions] }); setShowRoleForm(true); }}>Edit</button>
                          <button className="btn-sm-custom" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}
                            onClick={async () => {
                              if (!window.confirm(`Delete role "${r.name}"?`)) return;
                              try { await api.delete(`/roles/${r._id}`); toast.success('Role deleted'); fetchRoles(); }
                              catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
                            }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
      ) : isAdmin ? (
        <div className="card-custom mb-4">
          <h5 className="form-section-title" style={{ margin: 0, border: 0, padding: 0, marginBottom: '1rem' }}>
            <UsersIcon style={{ width: 20, height: 20, marginRight: 8, display: 'inline' }} />
            My Account
          </h5>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--tint)', padding: '1rem 1.5rem', borderRadius: 10, flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.3rem' }}>Logged in as</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>{user?.email}</div>
            </div>
            <Button className="btn-outline-custom btn-sm-custom" onClick={() => { setShowResetPw({ _id: user?.id, name: user?.name, email: user?.email }); setNewPassword(''); }}>
              Change Password
            </Button>
          </div>
        </div>
      ) : (
        <div className="card-custom mb-4">
          <h5 className="form-section-title" style={{ margin: 0, border: 0, padding: 0, marginBottom: '1rem' }}>
            <UsersIcon style={{ width: 20, height: 20, marginRight: 8, display: 'inline' }} />
            My Account
          </h5>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--tint)', padding: '1rem 1.5rem', borderRadius: 10, flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: '0.3rem' }}>Logged in as</div>
              <div style={{ fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1rem' }}>{user?.name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted-ink)' }}>{user?.email}</div>
            </div>
            <Button className="btn-outline-custom btn-sm-custom" onClick={() => { setShowResetPw({ _id: user?.id, name: user?.name, email: user?.email }); setNewPassword(''); }}>
              Change Password
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      <Modal show={isAdmin && showUserForm} onHide={() => setShowUserForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">{editingUser ? 'Edit User' : 'Add New User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Name *</Form.Label>
                <Form.Control className="form-input" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} required />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label className="form-label-custom">Role</Form.Label>
                <Form.Select className="form-input"
                  value={userForm.role === 'admin' ? 'admin' : (userForm.jobRole || 'staff')}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === 'admin') setUserForm({ ...userForm, role: 'admin', jobRole: '' });
                    else if (v === 'staff') setUserForm({ ...userForm, role: 'staff', jobRole: '' });
                    else setUserForm({ ...userForm, role: 'staff', jobRole: v });
                  }}>
                  <option value="admin">Admin (full access)</option>
                  <option value="staff">Staff (basic)</option>
                  {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label className="form-label-custom">Email *</Form.Label>
                <Form.Control className="form-input" type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
              </Form.Group>
            </Col>
            {!editingUser && (
              <Col xs={12}>
                <Form.Group>
                  <Form.Label className="form-label-custom">Password * (min 6 characters)</Form.Label>
                  <Form.Control className="form-input" type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} placeholder="Enter password" required />
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowUserForm(false)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={async () => {
            try {
              if (editingUser) {
                await api.put(`/users/${editingUser._id}`, { name: userForm.name, email: userForm.email, role: userForm.role, jobRole: userForm.jobRole || null });
                toast.success('User updated');
              } else {
                if (!userForm.name || !userForm.email || !userForm.password) return toast.error('Fill all required fields');
                await api.post('/users', userForm);
                toast.success('User created');
              }
              setShowUserForm(false);
              fetchUsers();
            } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
          }}>{editingUser ? 'Update' : 'Create User'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Job Role Modal */}
      <Modal show={isAdmin && showRoleForm} onHide={() => setShowRoleForm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">{editingRole ? 'Edit Job Role' : 'Add Job Role'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="form-label-custom">Role Name *</Form.Label>
            <Form.Control className="form-input" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Production Manager" />
          </Form.Group>
          <Form.Label className="form-label-custom">Can Access *</Form.Label>
          <Row className="g-2">
            {SECTIONS.map(s => (
              <Col xs={6} key={s.key}>
                <Form.Check
                  type="checkbox"
                  id={`role-perm-${s.key}`}
                  label={s.label}
                  checked={roleForm.permissions.includes(s.key)}
                  onChange={e => {
                    const next = e.target.checked
                      ? [...roleForm.permissions, s.key]
                      : roleForm.permissions.filter(k => k !== s.key);
                    setRoleForm({ ...roleForm, permissions: next });
                  }}
                />
              </Col>
            ))}
          </Row>
          <div style={{ fontSize: '0.72rem', color: 'var(--soft-ink)', marginTop: '0.75rem' }}>
            Settings (own account & password) is always available to every user.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowRoleForm(false)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={async () => {
            if (!roleForm.name.trim()) return toast.error('Enter a role name');
            if (roleForm.permissions.length === 0) return toast.error('Select at least one section');
            try {
              if (editingRole) {
                await api.put(`/roles/${editingRole._id}`, roleForm);
                toast.success('Role updated');
              } else {
                await api.post('/roles', roleForm);
                toast.success('Role created');
              }
              setShowRoleForm(false);
              fetchRoles();
              fetchUsers();
            } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
          }}>{editingRole ? 'Update Role' : 'Create Role'}</Button>
        </Modal.Footer>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={isAdmin && !!showResetPw} onHide={() => setShowResetPw(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="modal-title-custom">Reset Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted-ink)' }}>Reset password for <strong>{showResetPw?.name}</strong> ({showResetPw?.email})</p>
          <Form.Group>
            <Form.Label className="form-label-custom">New Password * (min 6 characters)</Form.Label>
            <Form.Control className="form-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowResetPw(null)}>Cancel</Button>
          <Button className="btn-primary-custom" onClick={async () => {
            if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
            try {
              await api.put(`/users/${showResetPw._id}/reset-password`, { newPassword });
              toast.success('Password reset!');
              setShowResetPw(null);
            } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
          }}>Reset Password</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
