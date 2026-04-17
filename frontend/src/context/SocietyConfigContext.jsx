import { createContext, useContext, useState, useEffect } from 'react';
import { publicAPI } from '../services/api';

const SocietyConfigContext = createContext({
  config: { societyName: 'Society Management', tagline: '', propertyLabel: 'Villa' },
  refreshConfig: () => {},
});

export function SocietyConfigProvider({ children }) {
  const [config, setConfig] = useState({ societyName: 'Society Management', tagline: '', propertyLabel: 'Villa' });

  const fetchConfig = async () => {
    try {
      const res = await publicAPI.getSocietyConfig();
      setConfig(res.data);
      document.title = res.data.societyName || 'Society Management';
    } catch {
      // fallback to defaults
    }
  };

  useEffect(() => { fetchConfig(); }, []);

  return (
    <SocietyConfigContext.Provider value={{ config, refreshConfig: fetchConfig }}>
      {children}
    </SocietyConfigContext.Provider>
  );
}

export const useSocietyConfig = () => useContext(SocietyConfigContext);
