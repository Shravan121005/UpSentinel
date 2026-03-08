import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MonitorCard from '../components/MonitorCard';
import AddMonitorModal from '../components/AddMonitorModal';
import { getMonitors, createMonitor, deleteMonitor } from '../services/api';

export default function Dashboard() {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const { data } = await getMonitors();
      setMonitors(data.data || []);
    } catch {
      setError('Failed to fetch monitors. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (formData) => {
    const { data } = await createMonitor(formData);
    setMonitors((prev) => [data.data, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this monitor? This action cannot be undone.')) return;
    try {
      await deleteMonitor(id);
      setMonitors((prev) => prev.filter((m) => m._id !== id));
    } catch {
      setError('Failed to delete monitor.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Monitors</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {loading ? 'Loading...' : `${monitors.length} monitor${monitors.length !== 1 ? 's' : ''} configured`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Monitor
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-2">✕</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-56 mb-3" />
                    <div className="h-3 bg-gray-700 rounded w-28" />
                  </div>
                  <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : monitors.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-gray-300 font-medium text-lg">No monitors yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first URL to start tracking uptime</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-1.5 text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add a monitor
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {monitors.map((monitor) => (
              <MonitorCard key={monitor._id} monitor={monitor} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddMonitorModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}
