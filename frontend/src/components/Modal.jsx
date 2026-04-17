import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModalHeader } from '../context/ModalContext';

export default function Modal({ open, onClose, title, wide, full, children }) {
  const [visible, setVisible] = useState(false);
  const [portalTarget, setPortalTarget] = useState(null);
  const { openModal, closeModal } = useModalHeader();

  useEffect(() => {
    if (open) {
      const el = document.getElementById('main-page-content');
      setPortalTarget(el || document.body);
      openModal(title, onClose);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      closeModal();
    }
    return () => closeModal();
  }, [open, title]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open || !portalTarget) return null;

  const content = (
    <div className={`absolute inset-0 z-20 bg-body overflow-y-auto transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`${full ? '' : wide ? 'max-w-4xl' : 'max-w-2xl'} px-4 sm:px-6 py-6`}>
        {children}
      </div>
    </div>
  );

  return createPortal(content, portalTarget);
}
