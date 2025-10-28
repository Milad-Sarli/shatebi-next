import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string | React.ReactNode;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  isConfirmDisabled?: boolean;
  variant?: "default" | "destructive" | "warning";
  children?: React.ReactNode;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  onClose,
  title, 
  description, 
  confirmText, 
  cancelText = "انصراف", 
  onConfirm, 
  isLoading = false,
  isConfirmDisabled = false,
  variant = "default",
  children
}) => {
  // Unified close handler for both onOpenChange and onClose
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          button: "bg-red-600 hover:bg-red-700 text-white",
          icon: "text-red-500"
        };
      case "warning":
        return {
          button: "bg-orange-600 hover:bg-orange-700 text-white",
          icon: "text-orange-500"
        };
      default:
        return {
          button: "bg-blue-600 hover:bg-blue-700 text-white",
          icon: "text-blue-500"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {title}
          </DialogTitle>
          {description && (
            <div className="text-muted-foreground text-sm text-center">
              {description}
            </div>
          )}
        </DialogHeader>
        {children && <div className="py-2">{children}</div>}
        <div className="flex gap-4 py-4">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 ${styles.button}`}
            disabled={isLoading || isConfirmDisabled}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال انجام...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;