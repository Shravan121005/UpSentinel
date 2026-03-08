import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';

const INTERVAL_LABELS = { 60: '1 min', 300: '5 min', 600: '10 min' };

export default function MonitorCard({ monitor, onDelete }) {
  const navigate = useNavigate();

  return (
    <div
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer group"
      onClick={() => navigate(`/monitors/${monitor._id}`)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{monitor.url}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={monitor.status} />
            <span className="text-gray-500 text-xs">
              Every {INTERVAL_LABELS[monitor.interval] || `${monitor.interval}s`}
            </span>
            {monitor.antiSleep && (
              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full">
                Anti-sleep
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(monitor._id);
          }}
          className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
          title="Delete monitor"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
