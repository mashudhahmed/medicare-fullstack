import React, { useState } from 'react';
import Modal from './Modal';
import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { cn } from '../../utils/helpers';

export type ConfirmVariant = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  loading?: boolean;
}

const variantStyles: Record<
  ConfirmVariant,
  {
    iconBg: string;
    iconColor: string;
    defaultIcon: React.ReactNode;
    confirmBtn: string;
  }
> = {
  danger: {
    iconBg: 'bg-red-50 border-red-100',
    iconColor: 'text-red-600',
    defaultIcon: <FaExclamationTriangle className="w-6 h-6" />,
    confirmBtn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white shadow-sm',
  },
  warning: {
    iconBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
    defaultIcon: <FaExclamationCircle className="w-6 h-6" />,
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white shadow-sm',
  },
  primary: {
    iconBg: 'bg-teal-50 border-teal-100',
    iconColor: 'text-teal-600',
    defaultIcon: <FaInfoCircle className="w-6 h-6" />,
    confirmBtn: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500 text-white shadow-sm',
  },
  info: {
    iconBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
    defaultIcon: <FaInfoCircle className="w-6 h-6" />,
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white shadow-sm',
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  loading: externalLoading,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading ?? internalLoading;
  const currentVariant = variantStyles[variant];

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      size="md"
      showCloseButton={!isLoading}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center',
            currentVariant.iconBg,
            currentVariant.iconColor
          )}
        >
          {icon || currentVariant.defaultIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">
            {title}
          </h3>
          <div className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            {message}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            'w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            currentVariant.confirmBtn
          )}
        >
          {isLoading && <FaSpinner className="animate-spin text-sm" />}
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
