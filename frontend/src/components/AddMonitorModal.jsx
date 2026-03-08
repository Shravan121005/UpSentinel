import { useState } from 'react';

export default function AddMonitorModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ url: '', interval: 60, antiSleep: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add monitor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold text-lg">Add Monitor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">URL to monitor</label>
            <input
              type="url"
              required
              placeholder="https://example.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Check interval</label>
            <select
              value={form.interval}
              onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
            >
              <option value={60}>Every 1 minute</option>
              <option value={300}>Every 5 minutes</option>
              <option value={600}>Every 10 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, antiSleep: !form.antiSleep })}
              className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                form.antiSleep ? 'bg-green-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.antiSleep ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <div>
              <p className="text-gray-300 text-sm">Anti-sleep mode</p>
              <p className="text-gray-600 text-xs">Prevents hosting platforms from sleeping</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {loading ? 'Adding...' : 'Add Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
