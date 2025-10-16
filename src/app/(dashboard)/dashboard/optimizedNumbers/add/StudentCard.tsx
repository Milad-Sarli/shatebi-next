import React from 'react';
import Image from 'next/image';
import GradeDisplay from './GradeDisplay';
import ActionButtons from './ActionButtons';
import { Student, Grade, StudentActivity } from '@/lib/services/optimizedClass.service';
import { motion } from 'framer-motion';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { useAuth } from '@/lib/context/auth.context';
import { studentActivityService } from '@/lib/services/studentActivity.service';
import { toast } from 'sonner';
import { XCircle } from 'lucide-react';

interface StudentCardProps {
  studentData: Student;
  grades: Grade[];
  activities: StudentActivity[];
  handleAddNumber: (studentId: number) => void;
  handleProvideless: (studentId: number) => void;
  handleAbsent: (studentId: number) => void;
  handleEditGrade: (studentId: number, grade: Grade) => void;
  loading: boolean;
  actionLoading: boolean;
  selectedStudentForAction: Student | null;
  isProvideConfirmOpen: boolean;
  isGradeWithin24Hours: (grade: Grade) => boolean;
  formatLessonRange: (grade: Grade) => string;
  onAbsentDeleted: (studentId: number, activityId: number) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  studentData,
  grades,
  activities,
  handleAddNumber,
  handleProvideless,
  handleAbsent,
  handleEditGrade,
  loading,
  actionLoading,
  selectedStudentForAction,
  isProvideConfirmOpen,
  isGradeWithin24Hours,
  formatLessonRange,
  onAbsentDeleted,
}) => {
  const { accessToken } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeletingAbsent, setIsDeletingAbsent] = React.useState(false);
  const [absentToDelete, setAbsentToDelete] = React.useState<StudentActivity | null>(null);

  // Find all absent activities
  const absentActivities = activities.filter(activity => {
    const isExplicitlyAbsent = activity.class_absent === "1" || activity.class_absent === "true";
    const hasReason = activity.reason && activity.reason.trim() !== "";
    const isAbsentWithReason = hasReason && (!activity.class_absent);
    return isExplicitlyAbsent || isAbsentWithReason;
  });
  // Sort by created_at descending and pick the latest
  const latestAbsentActivity = absentActivities.length > 0
    ? absentActivities.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  const provideActivity = activities.find(activity => 
    activity.provideless === "1" || activity.provideless === "true"
  );

  const handleDeleteAbsent = async () => {
    if (!absentToDelete || !accessToken) return;
    setIsDeletingAbsent(true);
    try {
      await studentActivityService.delete(absentToDelete.id, accessToken);
      onAbsentDeleted(studentData.student.id, absentToDelete.id);
      toast.success("غیبت با موفقیت حذف شد.");
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting absent activity:", error);
      toast.error("خطا در حذف غیبت.");
    } finally {
      setIsDeletingAbsent(false);
      setAbsentToDelete(null);
    }
  };

  // Main student card UI
  return (
    <motion.div
      className="flex flex-col p-3 rounded-lg border transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-900/30"
      whileHover={{ scale: 1.01, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.99 }}
      layout="position"
    >
      {/* Student info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden">
            {/* Avatar logic: show image if available, else initial */}
            {studentData.student.aks ? (
              <Image
                src={studentData.student.aks.startsWith('http') 
                  ? studentData.student.aks 
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/${studentData.student.aks.startsWith('storage/') ? studentData.student.aks : `storage/${studentData.student.aks}`}`}
                alt={studentData.student.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{studentData.student.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 dark:text-zinc-50 font-medium">{studentData.student.name}</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{studentData.student.student_code}</span>
            {/* Absent/provideless status badge */}
            {latestAbsentActivity && (
              <div className="flex flex-wrap items-center gap-1 mt-1">
                <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                  غایب{latestAbsentActivity.reason ? ` (${latestAbsentActivity.reason})` : ''}
                </span>
                <button
                  onClick={() => {
                    setAbsentToDelete(latestAbsentActivity);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="حذف غیبت"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
            {!latestAbsentActivity && provideActivity && (
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full mt-1">
                عدم تحویل
              </span>
            )}
          </div>
        </div>
        <ActionButtons
          studentId={studentData.student.id}
          loading={loading}
          actionLoading={actionLoading}
          handleAddNumber={handleAddNumber}
          handleProvideless={handleProvideless}
          handleAbsent={handleAbsent}
          selectedStudentForAction={selectedStudentForAction}
          isProvideConfirmOpen={isProvideConfirmOpen}
        />
      </div>
      <GradeDisplay
        grades={grades}
        handleEditGrade={handleEditGrade}
        isGradeWithin24Hours={isGradeWithin24Hours}
        formatLessonRange={formatLessonRange}
        studentId={studentData.student.id}
      />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteAbsent}
        title="حذف غیبت"
        description="آیا از حذف این غیبت اطمینان دارید؟ این عمل قابل بازگشت نیست."
        isLoading={isDeletingAbsent}
      />
    </motion.div>
  );
};

export default StudentCard;