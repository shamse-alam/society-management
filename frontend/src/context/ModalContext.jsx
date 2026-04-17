import { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null); // { title, onClose }

  const openModal = useCallback((title, onClose) => setModal({ title, onClose }), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModalHeader() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModalHeader must be used within ModalProvider');
  return ctx;
}
