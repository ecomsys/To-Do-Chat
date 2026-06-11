import { create } from 'zustand';

const useModalStore = create((set, get) => ({
  isOpen: false,
  content: null,
  title: null,
  onClose: null,
  classes: null,
  blockUntil: null,

  openModal: ({ content, title, onClose, classes, blockDuration }) => {
    const blockUntil = blockDuration ? Date.now() + blockDuration : null;
    set({
      isOpen: true,
      content,
      classes,
      title: title || null,
      onClose: onClose || null,
      blockUntil,
    });
  },
  
  closeModal: () => {
    const { blockUntil } = get();
    // Защита от закрытия, если установлен блок
    if (blockUntil && Date.now() < blockUntil) {
      console.warn('Modal is blocked – cannot close manually');
      return;
    }
    set({
      isOpen: false,
      content: null,
      title: null,
      classes: null,
      onClose: null,
      blockUntil: null,
    });
  },
}));

export default useModalStore;