import { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

export type NotificationType = 'success' | 'error';

interface NotificationProps {
  type: NotificationType;
  message: string;
  description?: string;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Notification({
  type,
  message,
  description,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: NotificationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for transition to complete
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300); // Wait for transition to complete
  };

  return (
    <Transition
      show={show}
      enter="transform ease-out duration-300 transition"
      enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enterTo="translate-y-0 opacity-100 sm:translate-x-0"
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="glass-panel pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-ny-border bg-ny-surface shadow-glass-lg">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {type === 'success' ? (
                <CheckCircleIcon className="h-6 w-6 text-emerald-400" aria-hidden="true" />
              ) : (
                <ExclamationCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-ny-text">{message}</p>
              {description && <p className="mt-1 text-sm text-ny-text-muted">{description}</p>}
            </div>
            <div className="flex shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex rounded-lg bg-ny-surface-elevated text-ny-text-muted hover:text-ny-text hover:bg-ny-accent-muted focus:outline-none focus:ring-2 focus:ring-ny-accent focus:ring-offset-2 focus:ring-offset-ny-bg"
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}
