import { createPortal } from 'react-dom';
import { HiExclamationTriangle } from 'react-icons/hi2';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className={`flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${isDangerous ? 'bg-red-100 dark:bg-red-500/10' : 'bg-violet-100 dark:bg-violet-500/10'}`}>
          <HiExclamationTriangle className={`w-6 h-6 ${isDangerous ? 'text-red-600 dark:text-red-400' : 'text-violet-600 dark:text-violet-400'}`} />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-xl transition-all font-medium ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/30'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;
