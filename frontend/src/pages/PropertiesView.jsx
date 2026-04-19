import { ListSkeleton } from '../components/Skeleton';
import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Search, Building2 } from 'lucide-react';
import { useSocietyConfig } from '../context/SocietyConfigContext';

const STATUS_COLORS = {
  OCCUPIED: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  VACANT: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  RENTED: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
};

export default function PropertiesView() {
  const { config: societyConfig } = useSocietyConfig();
  const propertyLabel = societyConfig?.propertyLabel || 'Property';
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    const fetchProperties = async () => {
      try { const { data } = await userAPI.getProperties(); setProperties(data); }
      catch (err) { console.error('Failed to load properties', err); }
      finally { setLoading(false); }
    };
    fetchProperties();
  }, []);

  const filtered = properties.filter(v => {
    const num = v.unitNumber || '';
    const matchSearch = num.toLowerCase().includes(search.toLowerCase()) || (v.ownerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-heading">{societyConfig.societyName || 'Society'} {propertyLabel}s</h1>
          <p className="text-[13px] text-muted mt-0.5">{properties.length} {propertyLabel.toLowerCase()}s in {societyConfig.societyName || 'the society'}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${propertyLabel.toLowerCase()}s...`} className="w-full pl-10 pr-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-heading placeholder:text-muted" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-input-bg border border-input-border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-heading">
          <option value="ALL">All Status</option><option value="OCCUPIED">Occupied</option><option value="VACANT">Vacant</option><option value="RENTED">Rented</option>
        </select>
      </div>

      {loading ? <ListSkeleton /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((property) => (
            <div key={property.id} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                <div>
                  <h3 className="font-semibold text-heading">{property.unitNumber}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[property.status]}`}>{property.status}</span>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted">Owner</span><span className="text-heading font-medium">{property.ownerName || '-'}</span></div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted">{`No ${propertyLabel.toLowerCase()}s found`}</div>}
        </div>
      )}
    </div>
  );
}
