import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface StudentType {
  id: number;
  name: string;
  father_name: string;
  student_code: string;
  phone: string;
  parent_phone: string;
  aks?: string | null;
}

interface AbsentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentType;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

const AbsentModal: React.FC<AbsentModalProps> = ({ isOpen, onOpenChange, student, onSubmit, isLoading = false }) => {
  const absentReasons = [
    { value: "مرخصی", label: "مرخصی" },
    { value: "بدون هماهنگی", label: "بدون هماهنگی" },
    { value: "مریض", label: "مریض" }
  ];

  const [loadingReason, setLoadingReason] = React.useState<string | null>(null);

  const handleReasonSelect = (reason: string) => {
    setLoadingReason(reason);
    onSubmit(reason);
  };

  React.useEffect(() => {
    if (!isLoading) {
      setLoadingReason(null);
    }
  }, [isLoading]);

  return (
    <Dialog open={isOpen} onOpenChange={!isLoading ? onOpenChange : () => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            ثبت غیبت برای {student.name}
          </DialogTitle>
          <DialogDescription className="text-center">
            لطفا دلیل غیبت را انتخاب کنید
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {absentReasons.map((reason) => (
            <Button
              key={reason.value}
              onClick={() => handleReasonSelect(reason.value)}
              disabled={isLoading}
              className="w-full text-right justify-between px-4 py-3 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              variant="outline"
            >
              {isLoading && loadingReason === reason.value ? (
                <div className="flex items-center gap-2 w-full justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ثبت...</span>
                </div>
              ) : (
                <>
                  <span className="text-base">{reason.label}</span>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-2 h-2 rounded-full bg-red-500"
                  />
                </>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbsentModal;