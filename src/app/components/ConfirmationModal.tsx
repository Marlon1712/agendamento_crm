'use client';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100 animate-slide-up">
        <h3 className={`text-xl font-bold mb-2 ${isDanger ? 'text-red-600' : 'text-gray-800'}`}>
          {title}
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                : 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
