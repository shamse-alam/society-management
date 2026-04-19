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
