import React from 'react';
import Image from 'next/image';
import GradeDisplay from './GradeDisplay';
import ActionButtons from './ActionButtons';
import { Student, Grade, StudentActivity } from '@/lib/services/optimizedClass.service';
import { motion } from 'framer-motion';

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
}) => {
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

  // Main student card UI
  return (
    <motion.div
      className="flex flex-col p-3 rounded-lg border transition-all duration-300"
      whileHover={{ scale: 1.025, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Student info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden">
            {/* Avatar logic: show image if available, else initial */}
            {studentData.student.aks ? (
              <Image
                src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${studentData.student.aks}`}
                alt={studentData.student.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-emerald-600 font-medium">{studentData.student.name.charAt(0)}</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-900 font-medium">{studentData.student.name}</span>
            <span className="text-xs text-zinc-500">{studentData.student.student_code}</span>
            {/* Absent/provideless status badge */}
            {latestAbsentActivity && (
              <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full mt-1">
                غایب{latestAbsentActivity.reason ? ` (${latestAbsentActivity.reason})` : ''}
              </span>
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
    </motion.div>
  );
};

export default StudentCard; 