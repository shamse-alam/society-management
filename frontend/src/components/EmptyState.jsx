import { Inbox } from 'lucide-react';

/**
 * Reusable empty state with icon, message, and optional action.
 *
 * @param {import('lucide-react').LucideIcon} icon - Lucide icon component
 * @param {string} title - Primary message
 * @param {string} [description] - Secondary description
 * @param {React.ReactNode} [action] - Optional button/link
 */
export default function EmptyState({ icon: Icon = Inbox, title = 'No data found', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-indigo-400 dark:text-indigo-500" />
      </div>
      <p className="text-[15px] font-semibold text-heading">{title}</p>
      {description && <p className="text-[13px] text-muted mt-1 text-center max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
