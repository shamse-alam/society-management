import { createContext, useContext, useState, useEffect } from 'react';
import { publicAPI } from '../services/api';

const SocietyConfigContext = createContext({
  config: { societyName: 'Society Management', tagline: '', propertyLabel: 'Villa' },
  incomeTypes: [],
  expenseTypes: [],
  refreshConfig: () => {},
});

export function SocietyConfigProvider({ children }) {
  const [config, setConfig] = useState({ societyName: 'Society Management', tagline: '', propertyLabel: 'Villa' });
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);

  const fetchConfig = async () => {
    try {
      const [configRes, incomeRes, expenseRes] = await Promise.all([
        publicAPI.getSocietyConfig(),
        publicAPI.getIncomeTypes(),
        publicAPI.getExpenseTypes(),
      ]);
      setConfig(configRes.data);
      setIncomeTypes(incomeRes.data);
      setExpenseTypes(expenseRes.data);
      document.title = configRes.data.societyName || 'Society Management';
    } catch {
      // fallback to defaults
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <SocietyConfigContext.Provider value={{ config, incomeTypes, expenseTypes, refreshConfig: fetchConfig }}>
      {children}
    </SocietyConfigContext.Provider>
  );
}

export const useSocietyConfig = () => useContext(SocietyConfigContext);

/** Look up display name for an income or expense type code. Falls back to formatted code. */
export function typeName(code, incomeTypes = [], expenseTypes = []) {
  if (!code) return '';
  const found = incomeTypes.find(t => t.code === code) || expenseTypes.find(t => t.code === code);
  return found?.displayName || code.replace(/_/g, ' ');
}
