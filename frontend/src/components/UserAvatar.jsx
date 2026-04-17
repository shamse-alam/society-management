const COLORS = [
  'bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600',
  'bg-cyan-600', 'bg-pink-600', 'bg-blue-600', 'bg-teal-600',
];

function getColor(name) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function UserAvatar({ name, src, size = 'sm' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-[13px]',
    lg: 'w-12 h-12 text-[15px]',
  };

  const sizeClass = sizes[size] || sizes.sm;
  const initial = name?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <span className={`${sizeClass} relative inline-block shrink-0`}>
        <img
          src={src}
          alt={name || 'User'}
          className={`${sizeClass} rounded-full object-cover`}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}
        />
        <div style={{ display: 'none' }} className={`${sizeClass} ${getColor(name)} rounded-full items-center justify-center absolute inset-0`}>
          <span className="text-white font-semibold">{initial}</span>
        </div>
      </span>
    );
  }

  return (
    <div className={`${sizeClass} ${getColor(name)} rounded-full flex items-center justify-center shrink-0`}>
      <span className="text-white font-semibold">{initial}</span>
    </div>
  );
}
