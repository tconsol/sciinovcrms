import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import Dropdown from '../components/Dropdown';
import ConfirmDialog from '../components/ConfirmDialog';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conferences, setConferences] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    country: '',
    role: 'Attendee',
    topic: '',
    abstract: '',
    status: 'REGISTERED',
    conferenceId: '',
    conferenceName: '',
  });

  useEffect(() => {
    api.get('/sciinov/conferences').then(({ data }) => {
      setConferences(Array.isArray(data) ? data : []);
    }).catch(() => {});

    if (isEdit) {
      setLoading(true);
      api.get(`/clients/${id}`)
        .then(({ data }) => {
          setForm({
            fullName: data.fullName || '',
            email: data.email || '',
            phone: data.phone || '',
            organization: data.organization || '',
            country: data.country || '',
            role: data.role || 'Attendee',
            topic: data.topic || '',
            abstract: data.abstract || '',
            status: data.status || 'REGISTERED',
            conferenceId: data.conferenceId || '',
            conferenceName: data.conferenceName || '',
          });
        })
        .catch(() => toast.error('Failed to load client'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleConferenceChange = (e) => {
    const confId = e.target.value;
    const conf = conferences.find((c) => (c._id || c.id) === confId);
    setForm((prev) => ({
      ...prev,
      conferenceId: confId,
      conferenceName: conf ? (conf.name || conf.title) : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    setSaving(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (imageFile) {
        formData.append('profileImage', imageFile);
      }

      if (isEdit) {
        await api.put(`/clients/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Client updated');
      } else {
        await api.post('/clients', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Client created');
      }
      navigate('/clients');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || 'Failed to save client';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/clients')}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          title="Back to Clients"
        >
          <HiOutlineArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEdit ? 'Edit Client' : 'Add New Client'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <input
              name="organization"
              value={form.organization}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <Dropdown
              value={form.role}
              onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
              options={[
                { value: 'Speaker', label: 'Speaker' },
                { value: 'Attendee', label: 'Attendee' },
                { value: 'Sponsor', label: 'Sponsor' },
              ]}
              placeholder="Select Role"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Dropdown
              value={form.status}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
              options={[
                { value: 'REGISTERED', label: 'Registered' },
                { value: 'PAID', label: 'Paid' },
                { value: 'DECLINED', label: 'Declined' },
                { value: 'NEXT_EDITION_INTEREST', label: 'Next Edition Interest' },
              ]}
              placeholder="Select Status"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conference</label>
            <Dropdown
              value={form.conferenceId}
              onChange={(confId) => {
                const conf = conferences.find((c) => (c._id || c.id) === confId);
                setForm((prev) => ({
                  ...prev,
                  conferenceId: confId,
                  conferenceName: conf ? (conf.name || conf.title) : '',
                }));
              }}
              options={conferences.map((c) => ({
                value: c._id || c.id,
                label: c.name || c.title,
              }))}
              placeholder="Select Conference"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <input
            name="topic"
            value={form.topic}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Abstract</label>
          <textarea
            name="abstract"
            value={form.abstract}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Client' : 'Create Client'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="px-6 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirm}
        title={isEdit ? 'Update Client?' : 'Create Client?'}
        message={isEdit 
          ? 'Are you sure you want to update this client? This action cannot be undone.' 
          : 'Are you sure you want to create this new client?'}
        confirmText={isEdit ? 'Update' : 'Create'}
        cancelText="Cancel"
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
