'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate, formatCurrency, RIDER_STATUS_COLORS, getInitials } from '@/lib/utils';
import { Search, CheckCircle, XCircle, Eye, UserPlus, Trash2, X, Pencil } from 'lucide-react';

interface Rider {
  id: string;
  status: string;
  availabilityStatus: string;
  motorcycleMake: string;
  motorcycleModel: string;
  motorcyclePlate: string;
  licenseClass: string;
  licenseNumber: string;
  averageRating: number;
  completedDeliveries: number;
  walletBalance: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePhotoUrl: string;
    status: string;
  };
}

interface RidersResponse {
  data: Rider[];
  meta: { total: number; page: number; totalPages: number };
}

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '', password: '',
  motorcycleMake: '', motorcycleModel: '', motorcycleColor: '', motorcyclePlate: '',
  licenseClass: '', licenseNumber: '',
};

export default function RidersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Rider | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Rider | null>(null);
  const [editTarget, setEditTarget] = useState<Rider | null>(null);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', motorcycleMake: '', motorcycleModel: '', motorcycleColor: '', motorcyclePlate: '', licenseClass: '', licenseNumber: '' });
  const [editError, setEditError] = useState('');

  const { data, isLoading } = useQuery<RidersResponse>({
    queryKey: ['riders', search, statusFilter, page],
    queryFn: () =>
      api.get(
        `/admin/riders?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`
      ),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/riders/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riders'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/riders/${id}/reject`, { reason: 'Documents incomplete' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['riders'] }),
  });

  const addRider = useMutation({
    mutationFn: (values: typeof EMPTY_FORM) =>
      api.post('/auth/register', { ...values, role: 'RIDER' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      setFormError('');
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to create rider');
    },
  });

  const editRider = useMutation({
    mutationFn: ({ id, values }: { id: string; values: typeof editForm }) =>
      api.patch(`/admin/riders/${id}`, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riders'] });
      setEditTarget(null);
      setEditError('');
    },
    onError: (err: any) => setEditError(err?.message || 'Failed to update rider'),
  });

  const deleteRider = useMutation({
    mutationFn: (rider: Rider) => api.patch(`/admin/users/${rider.user.id}/suspend`, { reason: 'Removed by admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['riders'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      setDeleteTarget(null);
    },
  });

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.firstName || !editForm.lastName) { setEditError('First and last name are required'); return; }
    editRider.mutate({ id: editTarget.id, values: editForm });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.firstName || !form.lastName) { setFormError('First and last name are required'); return; }
    if (!form.email && !form.phone) { setFormError('Email or phone is required'); return; }
    if (!form.password || form.password.length < 8) { setFormError('Password must be at least 8 characters'); return; }
    addRider.mutate(form);
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h2>Riders</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.meta.total ?? 0} total riders
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setForm(EMPTY_FORM); setFormError(''); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <UserPlus size={16} />
          Add Rider
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search riders…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-muted rounded-lg outline-none border-0 focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rider</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motorcycle</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Deliveries</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Balance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : data?.data.map((rider) => (
                    <tr key={rider.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 font-semibold text-xs flex-shrink-0 overflow-hidden">
                            {rider.user.profilePhotoUrl ? (
                              <img src={rider.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              getInitials(rider.user.firstName, rider.user.lastName)
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {rider.user.firstName} {rider.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{rider.user.phone || rider.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${RIDER_STATUS_COLORS[rider.status]}`}>
                          {rider.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {rider.motorcycleMake
                          ? `${rider.motorcycleMake} ${rider.motorcycleModel} · ${rider.motorcyclePlate}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">⭐ {rider.averageRating.toFixed(1)}</span>
                      </td>
                      <td className="px-4 py-3">{rider.completedDeliveries}</td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(rider.walletBalance)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(rider.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelected(rider)}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setEditTarget(rider);
                              setEditForm({
                                firstName: rider.user.firstName,
                                lastName: rider.user.lastName,
                                email: rider.user.email,
                                phone: rider.user.phone,
                                motorcycleMake: rider.motorcycleMake || '',
                                motorcycleModel: rider.motorcycleModel || '',
                                motorcycleColor: '',
                                motorcyclePlate: rider.motorcyclePlate || '',
                                licenseClass: rider.licenseClass || '',
                                licenseNumber: rider.licenseNumber || '',
                              });
                              setEditError('');
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          {rider.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => approveMutation.mutate(rider.id)}
                                className="p-1.5 rounded-lg hover:bg-green-50 transition-colors text-green-600"
                                title="Approve"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => rejectMutation.mutate(rider.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                                title="Reject"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDeleteTarget(rider)}
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
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Page {data.meta.page} of {data.meta.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page === data.meta.totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rider detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 font-bold text-xl overflow-hidden">
                {selected.user.profilePhotoUrl ? (
                  <img src={selected.user.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  getInitials(selected.user.firstName, selected.user.lastName)
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">{selected.user.firstName} {selected.user.lastName}</h3>
                <p className="text-muted-foreground text-sm">{selected.user.email}</p>
                <span className={`status-badge mt-1 ${RIDER_STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Phone</p>
                <p className="font-medium">{selected.user.phone || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Availability</p>
                <p className="font-medium">{selected.availabilityStatus}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Motorcycle</p>
                <p className="font-medium">{selected.motorcycleMake ? `${selected.motorcycleMake} ${selected.motorcycleModel}` : '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Plate</p>
                <p className="font-medium">{selected.motorcyclePlate || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Rating</p>
                <p className="font-medium">⭐ {selected.averageRating.toFixed(1)}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Wallet Balance</p>
                <p className="font-medium">{formatCurrency(selected.walletBalance)}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Licence Class</p>
                <p className="font-medium">{selected.licenseClass || '—'}</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-muted-foreground text-xs mb-1">Licence Number</p>
                <p className="font-medium">{selected.licenseNumber || '—'}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {selected.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => { approveMutation.mutate(selected.id); setSelected(null); }}
                    className="flex-1 py-2.5 bg-brand-green-500 text-white rounded-lg text-sm font-medium hover:bg-brand-green-600 transition-colors"
                  >
                    Approve Rider
                  </button>
                  <button
                    onClick={() => { rejectMutation.mutate(selected.id); setSelected(null); }}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Rider Modal ────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditTarget(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Edit Rider</h3>
              <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
            </div>
            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{editError}</div>
            )}
            <form onSubmit={handleEdit} className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Info</p>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Motorcycle Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Make</label>
                  <input value={editForm.motorcycleMake} onChange={e => setEditForm(f => ({ ...f, motorcycleMake: e.target.value }))}
                    placeholder="Yamaha" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Model</label>
                  <input value={editForm.motorcycleModel} onChange={e => setEditForm(f => ({ ...f, motorcycleModel: e.target.value }))}
                    placeholder="FZ-S" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Color</label>
                  <input value={editForm.motorcycleColor} onChange={e => setEditForm(f => ({ ...f, motorcycleColor: e.target.value }))}
                    placeholder="Red" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Plate Number</label>
                  <input value={editForm.motorcyclePlate} onChange={e => setEditForm(f => ({ ...f, motorcyclePlate: e.target.value }))}
                    placeholder="GR-1234-22" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Licence</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Licence Class</label>
                  <input value={editForm.licenseClass} onChange={e => setEditForm(f => ({ ...f, licenseClass: e.target.value }))}
                    placeholder="e.g. B, C, D" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Licence Number</label>
                  <input value={editForm.licenseNumber} onChange={e => setEditForm(f => ({ ...f, licenseNumber: e.target.value }))}
                    placeholder="e.g. GHA-12345678" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={editRider.isPending}
                  className="flex-1 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {editRider.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Rider Modal ─────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Add New Rider</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X size={18} /></button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{formError}</div>
            )}

            <form onSubmit={handleAdd} className="space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">First Name *</label>
                  <input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    placeholder="Emmanuel" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Last Name *</label>
                  <input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    placeholder="Tetteh" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="rider@gmail.com" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+233200111001" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Motorcycle Details (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Make</label>
                  <input value={form.motorcycleMake} onChange={e => setForm(f => ({ ...f, motorcycleMake: e.target.value }))}
                    placeholder="Yamaha" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Model</label>
                  <input value={form.motorcycleModel} onChange={e => setForm(f => ({ ...f, motorcycleModel: e.target.value }))}
                    placeholder="FZ-S" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Color</label>
                  <input value={form.motorcycleColor} onChange={e => setForm(f => ({ ...f, motorcycleColor: e.target.value }))}
                    placeholder="Red" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Plate Number</label>
                  <input value={form.motorcyclePlate} onChange={e => setForm(f => ({ ...f, motorcyclePlate: e.target.value }))}
                    placeholder="GR-1234-22" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Licence</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Licence Class</label>
                  <input value={form.licenseClass} onChange={e => setForm(f => ({ ...f, licenseClass: e.target.value }))}
                    placeholder="e.g. B, C, D" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Licence Number</label>
                  <input value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))}
                    placeholder="e.g. GHA-12345678" className="w-full px-3 py-2.5 text-sm bg-muted rounded-lg outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={addRider.isPending}
                  className="flex-1 py-2.5 bg-brand-green-500 hover:bg-brand-green-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                  {addRider.isPending ? 'Adding…' : 'Add Rider'}
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
            <h3 className="text-lg font-bold text-center mb-2">Delete Rider</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{deleteTarget.user.firstName} {deleteTarget.user.lastName}</span>? This will suspend their account.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors">
                Cancel
              </button>
              <button onClick={() => deleteRider.mutate(deleteTarget)} disabled={deleteRider.isPending}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
                {deleteRider.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
