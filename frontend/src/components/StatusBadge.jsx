export default function StatusBadge({ status }) {
  const isPositive = status === 'UP' || status === 'active';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        isPositive
          ? 'bg-green-900/40 text-green-400 border-green-800'
          : 'bg-red-900/40 text-red-400 border-red-800'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
      />
      {status?.toUpperCase()}
    </span>
  );
}
