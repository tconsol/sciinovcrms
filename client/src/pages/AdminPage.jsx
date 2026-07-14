import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Dropdown from '../components/Dropdown';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineUpload, HiOutlinePhotograph,
} from 'react-icons/hi';

const inputCls = 'w-full px-3 py-2 bg-gray-100 dark:bg-white/[0.06] border border-gray-300 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-violet-500 dark:focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all';
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider';

const TABS = ['Conferences', 'Roles', 'Statuses', 'Payment Modes', 'Conversation Via', 'Branding'];

// ─── Conferences ──────────────────────────────────────────────────────────────

function ConferencesTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { name: '', description: '', date: '', location: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'conferences'],
    queryFn: () => api.get('/admin/conferences').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? api.put(`/admin/conferences/${editItem._id}`, data)
      : api.post('/admin/conferences', data),
    onSuccess: () => {
      toast.success(editItem ? 'Conference updated' : 'Conference created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'conferences'] });
      setShowForm(false);
      setEditItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/conferences/${id}`),
    onSuccess: () => {
      toast.success('Conference deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'conferences'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({
      name: item.name || '', description: item.description || '',
      date: item.date ? item.date.slice(0, 10) : '',
      location: item.location || '', isActive: item.isActive !== false,
    });
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{items.length} conference{items.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
          <HiOutlinePlus className="w-4 h-4" /> Add Conference
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{editItem ? 'Edit Conference' : 'New Conference'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required placeholder="Conference name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="City, Country" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className={`${inputCls} dark:[color-scheme:dark]`} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={form.isActive ? 'true' : 'false'}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
                options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Short description..." className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm">No conferences yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                  <div className="flex flex-wrap gap-2 mt-0.5">
                    {item.location && <span className="text-xs text-gray-400 dark:text-slate-500">{item.location}</span>}
                    {item.date && <span className="text-xs text-gray-400 dark:text-slate-500">{new Date(item.date).toLocaleDateString()}</span>}
                    {item.description && <span className="text-xs text-gray-400 dark:text-slate-500 truncate">{item.description}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-3">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium mr-2 ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
                <button type="button" onClick={() => openEdit(item)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button type="button" onClick={() => setDeleteId(item._id)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Conference?"
          message="This will remove the conference from the list."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────────

function RolesTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { name: '', label: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => api.get('/admin/roles').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? api.put(`/admin/roles/${editItem._id}`, data)
      : api.post('/admin/roles', data),
    onSuccess: () => {
      toast.success(editItem ? 'Role updated' : 'Role created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setShowForm(false);
      setEditItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      toast.success('Role deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name || '', label: item.label || '', isActive: item.isActive !== false });
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{items.length} role{items.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
          <HiOutlinePlus className="w-4 h-4" /> Add Role
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{editItem ? 'Edit Role' : 'New Role'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Key (internal) *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. Speaker" disabled={Boolean(editItem)}
                className={`${inputCls} ${editItem ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>Display Label</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Conference Speaker" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={form.isActive ? 'true' : 'false'}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
                options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm">No roles yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label || item.name}</p>
                  {item.label && item.label !== item.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{item.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium mr-2 ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
                <button type="button" onClick={() => openEdit(item)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button type="button" onClick={() => setDeleteId(item._id)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Role?"
          message="This role will no longer appear in client forms."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Statuses ─────────────────────────────────────────────────────────────────

function StatusesTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { name: '', label: '', color: '#6366f1', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'statuses'],
    queryFn: () => api.get('/admin/statuses').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? api.put(`/admin/statuses/${editItem._id}`, data)
      : api.post('/admin/statuses', data),
    onSuccess: () => {
      toast.success(editItem ? 'Status updated' : 'Status created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      setShowForm(false);
      setEditItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/statuses/${id}`),
    onSuccess: () => {
      toast.success('Status deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'statuses'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name || '', label: item.label || '', color: item.color || '#6366f1', isActive: item.isActive !== false });
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{items.length} status{items.length !== 1 ? 'es' : ''}</p>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
          <HiOutlinePlus className="w-4 h-4" /> Add Status
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{editItem ? 'Edit Status' : 'New Status'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Key (internal) *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. REGISTERED" disabled={Boolean(editItem)}
                className={`${inputCls} font-mono ${editItem ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>Display Label</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Registered" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="h-10 w-12 rounded-xl border border-gray-300 dark:border-white/10 bg-transparent cursor-pointer" />
                <input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#6366f1" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={form.isActive ? 'true' : 'false'}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
                options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm">No statuses yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0 border border-black/10" style={{ backgroundColor: item.color || '#6366f1' }} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label || item.name}</p>
                  {item.label && item.label !== item.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{item.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium mr-2 ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
                <button type="button" onClick={() => openEdit(item)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button type="button" onClick={() => setDeleteId(item._id)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Status?"
          message="This status will no longer appear in client forms."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Payment Modes ────────────────────────────────────────────────────────────

function PaymentModesTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { name: '', label: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'payment-modes'],
    queryFn: () => api.get('/admin/payment-modes').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? api.put(`/admin/payment-modes/${editItem._id}`, data)
      : api.post('/admin/payment-modes', data),
    onSuccess: () => {
      toast.success(editItem ? 'Payment mode updated' : 'Payment mode created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-modes'] });
      setShowForm(false);
      setEditItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/payment-modes/${id}`),
    onSuccess: () => {
      toast.success('Payment mode deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'payment-modes'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name || '', label: item.label || '', isActive: item.isActive !== false });
    setEditItem(item);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{items.length} payment mode{items.length !== 1 ? 's' : ''}</p>
        <button type="button" onClick={openAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
          <HiOutlinePlus className="w-4 h-4" /> Add Mode
        </button>
      </div>

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{editItem ? 'Edit Payment Mode' : 'New Payment Mode'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Key (internal) *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. UPI" disabled={Boolean(editItem)}
                className={`${inputCls} font-mono ${editItem ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>Display Label</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. UPI / Bank Transfer" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={form.isActive ? 'true' : 'false'}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
                options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm">No payment modes yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label || item.name}</p>
                  {item.label && item.label !== item.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{item.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium mr-2 ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
                <button type="button" onClick={() => openEdit(item)}
                  className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                  <HiOutlinePencil className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button type="button" onClick={() => setDeleteId(item._id)}
                    className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Payment Mode?"
          message="This mode will no longer appear in payment forms."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Conversation Via ─────────────────────────────────────────────────────────

function ConversationViaTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const emptyForm = { name: '', label: '', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin', 'conversation-via'],
    queryFn: () => api.get('/admin/conversation-via').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editItem
      ? api.put(`/admin/conversation-via/${editItem._id}`, data)
      : api.post('/admin/conversation-via', data),
    onSuccess: () => {
      toast.success(editItem ? 'Updated' : 'Created');
      queryClient.invalidateQueries({ queryKey: ['admin', 'conversation-via'] });
      setShowForm(false); setEditItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/conversation-via/${id}`),
    onSuccess: () => {
      toast.success('Deleted');
      queryClient.invalidateQueries({ queryKey: ['admin', 'conversation-via'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const openAdd = () => { setForm(emptyForm); setEditItem(null); setShowForm(true); };
  const openEdit = (item) => {
    setForm({ name: item.name || '', label: item.label || '', isActive: item.isActive !== false });
    setEditItem(item); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">{items.length} option{items.length !== 1 ? 's' : ''}</p>
        {isSuperAdmin && (
          <button type="button" onClick={openAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-violet-900/30 transition-all">
            <HiOutlinePlus className="w-4 h-4" /> Add Option
          </button>
        )}
      </div>

      {showForm && isSuperAdmin && (
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
          className="bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{editItem ? 'Edit Option' : 'New Option'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Key (internal) *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required placeholder="e.g. WHATSAPP" disabled={Boolean(editItem)}
                className={`${inputCls} font-mono ${editItem ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className={labelCls}>Display Label</label>
              <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. WhatsApp" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <Dropdown
                value={form.isActive ? 'true' : 'false'}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v === 'true' }))}
                options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
              {saveMutation.isPending ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white rounded-xl text-sm font-medium transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center py-10 text-gray-400 dark:text-slate-600 text-sm">No options yet. Super admin can add them.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] rounded-2xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${item.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'}`} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.label || item.name}</p>
                  {item.label && item.label !== item.name && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">{item.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-lg font-medium mr-2 ${item.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
                {isSuperAdmin && (
                  <>
                    <button type="button" onClick={() => openEdit(item)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setDeleteId(item._id)}
                      className="p-1.5 text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isSuperAdmin && (
        <ConfirmDialog
          isOpen={Boolean(deleteId)}
          title="Delete Option?"
          message="This option will be removed from the Conversation Via list."
          confirmText="Delete"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}

// ─── Branding ─────────────────────────────────────────────────────────────────

function BrandingTab({ isSuperAdmin }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState(null);

  const { data: logoUrl, isLoading } = useQuery({
    queryKey: ['settings', 'logo'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/settings/logo', { responseType: 'blob' });
        return URL.createObjectURL(data);
      } catch (err) {
        if (err.response?.status === 404) return null;
        throw err;
      }
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  });

  // Seed the editable form once settings load — refs elsewhere (e.g. Documents) always
  // re-fetch ['settings'] fresh, this local copy is only for the edit form itself.
  useEffect(() => {
    if (settings && !form) {
      setForm({
        orgName: settings.orgName || '',
        orgWebsite: settings.orgWebsite || '',
        contactAddress: settings.contactAddress || '',
        contactEmail: settings.contactEmail || '',
        contactWhatsapp: settings.contactWhatsapp || '',
      });
    }
  }, [settings, form]);

  const uploadMutation = useMutation({
    mutationFn: (selectedFile) => {
      const formData = new FormData();
      formData.append('logo', selectedFile);
      return api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      toast.success('Logo updated');
      setFile(null);
      setPreviewUrl(null);
      queryClient.invalidateQueries({ queryKey: ['settings', 'logo'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload logo'),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save settings'),
  });

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const displayUrl = previewUrl || logoUrl;

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <p className={labelCls}>Current Logo</p>
        <div className="w-48 h-48 flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] border border-dashed border-gray-300 dark:border-white/10 rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          ) : displayUrl ? (
            <img src={displayUrl} alt="Company logo" className="max-w-full max-h-full object-contain p-3" />
          ) : (
            <div className="text-center text-gray-400 dark:text-slate-600 text-xs px-4">
              <HiOutlinePhotograph className="w-8 h-8 mx-auto mb-2" />
              No logo uploaded yet
            </div>
          )}
        </div>

        {isSuperAdmin && (
          <div className="space-y-3 mt-4">
            <div>
              <label className={labelCls}>Upload New Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-violet-50 dark:file:bg-violet-500/10 file:text-violet-700 dark:file:text-violet-400 hover:file:bg-violet-100 dark:hover:file:bg-violet-500/20 cursor-pointer"
              />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">PNG, JPG, GIF or WEBP. Max 5MB. Used on all generated PDF documents.</p>
            </div>
            <button
              type="button"
              onClick={() => file && uploadMutation.mutate(file)}
              disabled={!file || uploadMutation.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 transition-all"
            >
              <HiOutlineUpload className="w-4 h-4" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Logo'}
            </button>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-white/[0.06]">
        <p className={labelCls}>Organization Details</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-4 -mt-1">Default header/footer info for generated documents — each document can still override these.</p>

        {!form ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 dark:border-slate-700 border-t-violet-500" />
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); saveSettingsMutation.mutate(form); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Organization Name</label>
                <input value={form.orgName} onChange={(e) => setForm((f) => ({ ...f, orgName: e.target.value }))}
                  disabled={!isSuperAdmin} placeholder="e.g. Sciinov Group" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input value={form.orgWebsite} onChange={(e) => setForm((f) => ({ ...f, orgWebsite: e.target.value }))}
                  disabled={!isSuperAdmin} placeholder="https://..." className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input value={form.contactAddress} onChange={(e) => setForm((f) => ({ ...f, contactAddress: e.target.value }))}
                disabled={!isSuperAdmin} placeholder="Street, City, State, ZIP, Country" className={inputCls} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contact Email</label>
                <input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  disabled={!isSuperAdmin} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Contact WhatsApp</label>
                <input value={form.contactWhatsapp} onChange={(e) => setForm((f) => ({ ...f, contactWhatsapp: e.target.value }))}
                  disabled={!isSuperAdmin} className={inputCls} />
              </div>
            </div>
            {isSuperAdmin && (
              <button type="submit" disabled={saveSettingsMutation.isPending}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all">
                {saveSettingsMutation.isPending ? 'Saving...' : 'Save Details'}
              </button>
            )}
          </form>
        )}

        {!isSuperAdmin && <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">Only super admins can update organization details.</p>}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('ROLE_SUPER_ADMIN');

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Config</h2>
        <p className="text-gray-400 dark:text-slate-500 text-sm mt-0.5">Manage conferences, roles, statuses, and payment modes</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-gray-200 dark:border-white/10 w-fit">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(i)}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === i
                ? 'bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm dark:shadow-none'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm dark:shadow-none">
        {activeTab === 0 && <ConferencesTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 1 && <RolesTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 2 && <StatusesTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 3 && <PaymentModesTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 4 && <ConversationViaTab isSuperAdmin={isSuperAdmin} />}
        {activeTab === 5 && <BrandingTab isSuperAdmin={isSuperAdmin} />}
      </div>
    </div>
  );
}
