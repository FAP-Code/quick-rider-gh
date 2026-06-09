'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, getInitials, USER_STATUS_COLORS } from '@/lib/utils';
import { Search, UserX, UserCheck, UserPlus, Trash2, X, Pencil } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  profilePhotoUrl: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
}

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', password: '' };
const EMPTY_EDIT = { firstName: '', lastName: '', email: '', phone: '' };

export default function CustomersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [editError, setEditError] = useState('');

  const { data, isLoading } = useQuery<{ data: Customer[]; meta: { total: number; page: number; totalPages: number } }>({
    queryKey: ['customers', search, page],
    queryFn: () =>
      api.get(`/admin/users?role=CUSTOMER&page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/suspend`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const activate = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });

  const addCustomer = useMutation({
    mutationFn: (values: typeof EMPTY_FORM) =>
      api.post('/auth/register', { ...values, role: 'CUSTOMER' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to create customer');
    },
  });

  const editCustomer = useMutation({
    mutationFn: ({ id, values }: { id: string; values: typeof EMPTY_EDIT }) =>
      api.patch(`/admin/users/${id}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      setEditTarget(null);
      setEditError('');
    },
    onError: (err: any) => setEditError(err?.message || 'Failed to update customer'),
  });

  const deleteCustomer = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/suspend`, { reason: 'Deleted by admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setDeleteTarget(null);
    },
  });

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.firstName || !editForm.lastName) { setEditError('First and last name are required'); return; }
    editCustomer.mutate({ id: editTarget.id, values: editForm });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.firstName || !form.lastName) { setFormError('First and last name are required'); return; }
    if (!form.email && !form.phone) { setFormError('Email or phone is required'); return; }
    if (!form.password || form.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    addCustomer.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2>Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">{data?.meta.total ?? 0} registered customers</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      <div className="bg-card rounded-xl border p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search customers…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verified</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Login</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              : data?.data.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs overflow-hidden flex-shrink-0">
                          {c.profilePhotoUrl
                            ? <img src={c.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                            : getInitials(c.firstName, c.lastName)}
                        </div>
                        <span className="font-medium">{c.firstName} {c.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-muted-foreground">{c.email || '—'}</p>
                      <p className="text-xs text-muted-foreground">{c.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.isEmailVerified && <span className="text-green-600">✓ Email </span>}
                      {c.isPhoneVerified && <span className="text-green-600">✓ Phone</span>}
                      {!c.isEmailVerified && !c.isPhoneVerified && <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${USER_STATUS_COLORS[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{c.lastLoginAt ? formatDate(c.lastLoginAt) : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditTarget(c); setEditForm({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone }); setEditError(''); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        {c.status === 'ACTIVE'
                          ? <button onClick={() => suspend.mutate(c.id)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors" title="Suspend"><UserX size={15} /></button>
                          : <button onClick={() => activate.mutate(c.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Activate"><UserCheck size={15} /></button>
                        }
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {data.meta.page} of {data.meta.totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Prev</button>
              <button onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add Customer Modal ──────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Add New Customer</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">First Name *</label>
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Kwame" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Last Name *</label>
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Mensah" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="kwame@gmail.com" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+233244123456" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addCustomer.isPending}
                  className="flex-1 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {addCustomer.isPending ? 'Adding…' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Customer Modal ────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Edit Customer</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
            </div>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{editError}</div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">First Name *</label>
                  <input value={editForm.firstName} onChange={e => setEditForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Last Name *</label>
                  <input value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Phone</label>
                <input type="tel" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editCustomer.isPending}
                  className="flex-1 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {editCustomer.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Delete Customer</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.firstName} {deleteTarget.lastName}</span>? This will suspend their account.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteCustomer.mutate(deleteTarget.id)} disabled={deleteCustomer.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {deleteCustomer.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
