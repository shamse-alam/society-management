import { Info } from 'lucide-react';

export default function InfoTooltip({ text }) {
  return (
    <span className="relative inline-flex items-center group ml-1">
      <Info className="w-3.5 h-3.5 text-muted cursor-help" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-56 px-2.5 py-1.5 text-[11px] text-white bg-gray-800 dark:bg-gray-700 rounded-lg shadow-lg z-50 font-normal leading-relaxed pointer-events-none">
        {text}
        <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-700" />
      </span>
    </span>
  );
}
