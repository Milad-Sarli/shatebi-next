import React from 'react';
import StudentCard from './StudentCard';
import { Student, Grade, StudentActivity } from '@/lib/services/optimizedClass.service';
import { motion, AnimatePresence } from "framer-motion";

interface StudentCardListProps {
  students: Student[];
  existingGrades: Record<number, Grade[]>;
  existingActivities: Record<number, StudentActivity[]>;
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
  setExistingActivities: React.Dispatch<React.SetStateAction<Record<number, StudentActivity[]>>>;
}

const StudentCardList: React.FC<StudentCardListProps> = ({
  students,
  existingGrades,
  existingActivities,
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
  setExistingActivities,
}) => {

  const handleAbsentDeleted = (studentId: number, activityId: number) => {
    setExistingActivities(prevActivities => ({
      ...prevActivities,
      [studentId]: prevActivities[studentId].filter(activity => activity.id !== activityId)
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {students.map((studentData, idx) => (
            <motion.div
              key={studentData.student.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              layout
            >
              <StudentCard
                studentData={studentData}
                grades={existingGrades[studentData.student.id] || []}
                activities={existingActivities[studentData.student.id] || []}
                handleAddNumber={handleAddNumber}
                handleProvideless={handleProvideless}
                handleAbsent={handleAbsent}
                handleEditGrade={handleEditGrade}
                loading={loading}
                actionLoading={actionLoading}
                selectedStudentForAction={selectedStudentForAction}
                isProvideConfirmOpen={isProvideConfirmOpen}
                isGradeWithin24Hours={isGradeWithin24Hours}
                formatLessonRange={formatLessonRange}
                onAbsentDeleted={handleAbsentDeleted}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentCardList;