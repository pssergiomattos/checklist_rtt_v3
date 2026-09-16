import React from 'react';
import { X, Download } from 'lucide-react';

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dataUrl: string;
}

export const PhotoModal: React.FC<PhotoModalProps> = ({
  isOpen,
  onClose,
  title,
  dataUrl,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    link.click();
  };

  return (
    <div
      id="modal-foto-preview"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <span className="font-semibold text-sm truncate max-w-[240px]">
            {title}
          </span>
          <div className="flex items-center gap-1">
            <button
              id="btn-baixar-foto"
              type="button"
              onClick={handleDownload}
              title="Baixar imagem"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              id="btn-fechar-modal-foto"
              type="button"
              onClick={onClose}
              title="Fechar"
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-2 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
          <img
            src={dataUrl}
            alt={title}
            className="max-h-[65vh] w-auto object-contain rounded-lg shadow-xs"
          />
        </div>

        <div className="p-3 bg-white text-center text-xs text-slate-500 border-t border-slate-100 flex justify-between items-center">
          <span>Foto comprimida e pronta para envio</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8b0000] font-bold hover:underline"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
