import React from 'react';
import { Grade } from '@/lib/services/optimizedClass.service';

interface GradeDisplayProps {
  grades: Grade[];
  handleEditGrade: (studentId: number, grade: Grade) => void;
  isGradeWithin24Hours: (grade: Grade) => boolean;
  formatLessonRange: (grade: Grade) => string;
  studentId: number;
}

const GradeDisplay: React.FC<GradeDisplayProps> = ({
  grades,
  handleEditGrade,
  isGradeWithin24Hours,
  formatLessonRange,
  studentId,
}) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      {grades && grades.length > 0 ? (
        grades.map((grade, gradeIndex) => {
          // Determine grade type
          const isHefzGrade = Number(grade.number) > 0 && Number(grade.hefz) === 0 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0 && grade.dars?.title?.toLowerCase().includes('حفظ');
          const isProvidelessGrade = Number(grade.hefz) === 55 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0;
          const isReadingGrade = Number(grade.number) > 0 && Number(grade.hefz) === 0 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0;
          
          // Check if this is a single-grade lesson (either by is_one_grade flag or by grade pattern)
          const isSingleGradeLesson = grade.dars?.is_one_grade || grade.droos_id?.is_one_grade || 
                                    (Number(grade.number) > 0 && Number(grade.hefz) === 0 && Number(grade.tajvid) === 0 && Number(grade.sout) === 0 && Number(grade.details) === 0);
          
          let totalScore: number;
          let isNegative: boolean;
          if (isHefzGrade || isReadingGrade || isSingleGradeLesson) {
            totalScore = Number(grade.number);
            isNegative = totalScore < 80;
          } else {
            totalScore = Number(grade.hefz) + Number(grade.tajvid) + Number(grade.sout) + Number(grade.details);
            isNegative = totalScore < 80;
          }
          return (
            <div
              key={gradeIndex}
              className={`group relative bg-gradient-to-br from-zinc-50 to-zinc-100 p-2 rounded-md hover:shadow-md transition-all duration-300 ${
                isNegative ? 'hover:border-2 hover:border-red-500/50 dark:hover:border-red-500/30' : ''
              } ${isProvidelessGrade ? 'border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20' : ''} ${
                isReadingGrade ? 'border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' : ''
              } ${isHefzGrade ? 'border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20' : ''} ${
                isSingleGradeLesson && !isHefzGrade && !isReadingGrade ? 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20' : ''
              }`}
            >
              {isProvidelessGrade ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">حفظ</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">55</span>
                      {isGradeWithin24Hours(grade) && (
                        <button
                          className="h-6 px-1 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded"
                          onClick={() => handleEditGrade(studentId, grade)}
                        >
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs">ویرایش</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {formatLessonRange(grade) && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center">{formatLessonRange(grade)}</div>
                  )}
                </div>
              ) : isReadingGrade ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">{grade.dars?.title || grade.droos_id?.title || "روخوانی"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{grade.number}</span>
                      {isNegative && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">منفی</span>
                      )}
                      {isGradeWithin24Hours(grade) && (
                        <button
                          className="h-6 px-1 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded"
                          onClick={() => handleEditGrade(studentId, grade)}
                        >
                          <span className="text-blue-600 dark:text-blue-400 text-xs">ویرایش</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {formatLessonRange(grade) && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center">{formatLessonRange(grade)}</div>
                  )}
                </div>
              ) : isHefzGrade ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">حفظ</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${Number(grade.number) < 80 ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>{grade.number}</span>
                      {Number(grade.number) < 80 && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">منفی</span>
                      )}
                      {isGradeWithin24Hours(grade) && (
                        <button
                          className="h-6 px-1 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 rounded"
                          onClick={() => handleEditGrade(studentId, grade)}
                        >
                          <span className="text-purple-600 dark:text-purple-400 text-xs">ویرایش</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {formatLessonRange(grade) && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center">{formatLessonRange(grade)}</div>
                  )}
                </div>
              ) : isSingleGradeLesson ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">{grade.dars?.title || grade.droos_id?.title || "تک نمره"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}>{grade.number}</span>
                      {isNegative && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">منفی</span>
                      )}
                      {isGradeWithin24Hours(grade) && (
                        <button
                          className="h-6 px-1 hover:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded"
                          onClick={() => handleEditGrade(studentId, grade)}
                        >
                          <span className="text-indigo-600 dark:text-indigo-400 text-xs">ویرایش</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {formatLessonRange(grade) && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center">{formatLessonRange(grade)}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{grade.dars?.title || "بدون نام"}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${isNegative ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{totalScore}</span>
                      {isNegative && (
                        <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">منفی</span>
                      )}
                      {isGradeWithin24Hours(grade) && (
                        <button
                          className="h-6 px-1 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded"
                          onClick={() => handleEditGrade(studentId, grade)}
                        >
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs">ویرایش</span>
                        </button>
                      )}
                    </div>
                  </div>
                  {formatLessonRange(grade) && (
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 text-center">{formatLessonRange(grade)}</div>
                  )}
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div>بدون نمره</div>
      )}
    </div>
  );
};

export default GradeDisplay;