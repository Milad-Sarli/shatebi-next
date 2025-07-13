import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface Course {
  id: number;
  title: string;
  is_one_grade: boolean | null;
}

interface Dars {
  id: number;
  title: string;
  is_one_grade?: boolean | null;
  children?: Array<Dars>;
}

interface SelectCourseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseSelect: (course: Course) => void;
  dars?: Dars;
}

const isReadingClass = (courseTitle: string): boolean => {
  const readingKeywords = ['روخوانی', 'قرائت', 'خواندن', 'reading'];
  return readingKeywords.some(keyword => 
    courseTitle.toLowerCase().includes(keyword.toLowerCase())
  );
};

const SelectCourseModal: React.FC<SelectCourseModalProps> = ({ isOpen, onOpenChange, onCourseSelect, dars }) => {
  const allCourses = React.useMemo(() => {
    const courses: Course[] = [];
    if (dars?.children && dars.children.length > 0) {
      dars.children.forEach((child) => {
        if (!courses.some(course => course.title === child.title)) {
          courses.push({
            id: child.id,
            title: child.title,
            is_one_grade: child.is_one_grade || null
          });
        }
      });
    }
    if (dars && !courses.some(course => course.title.includes(dars.title))) {
      courses.push({
        id: dars.id,
        title: dars.title,
        is_one_grade: dars.is_one_grade || null
      });
    }
    return courses;
  }, [dars]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            انتخاب درس
          </DialogTitle>
          <DialogDescription className="text-center">
            لطفا درس مورد نظر را انتخاب کنید
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {allCourses.map((course) => {
            const isReadingClassType = isReadingClass(course.title);
            const isHefzClass = course.title?.toLowerCase().includes('حفظ') || false;
            return (
              <Button
                key={course.id}
                onClick={() => {
                  onCourseSelect(course);
                  onOpenChange(false);
                }}
                className="w-full text-right justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                variant="outline"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{course.title}</span>
                  {isReadingClassType && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                      روخوانی
                    </span>
                  )}
                  {isHefzClass && !isReadingClassType && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                      حفظ
                    </span>
                  )}
                </div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SelectCourseModal; 