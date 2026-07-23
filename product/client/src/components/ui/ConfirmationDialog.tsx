import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'destructive' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}) => {
  let Icon = Info;
  let iconColor = 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';

  if (type === 'destructive') {
    Icon = AlertCircle;
    iconColor = 'text-red-500 bg-red-50 dark:bg-red-950/30';
  } else if (type === 'warning') {
    Icon = AlertTriangle;
    iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-950/30';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" closeOnOverlayClick={!isLoading}>
      <div className="flex flex-col items-center text-center p-2">
        <div className={cn('rounded-full p-3.5 mb-4', iconColor)}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        
        <div className="flex w-full gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            variant={type === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
