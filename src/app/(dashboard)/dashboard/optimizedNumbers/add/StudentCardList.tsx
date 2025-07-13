import React from 'react';
import StudentCard from './StudentCard';
import { Student, Grade } from '@/lib/services/optimizedClass.service';
import { motion, AnimatePresence } from "framer-motion";

interface StudentCardListProps {
  students: Student[];
  existingGrades: Record<number, Grade[]>;
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

const StudentCardList: React.FC<StudentCardListProps> = ({
  students,
  existingGrades,
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
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default StudentCardList; 