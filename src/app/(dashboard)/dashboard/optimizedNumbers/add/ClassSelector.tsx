import React from 'react';
import { OptimizedClass } from '@/lib/services/optimizedClass.service';
import { SingleSelectCombobox } from '@/components/ui/Combobox';

interface ClassSelectorProps {
  classes: OptimizedClass[];
  selectedClass: OptimizedClass | null;
  onChange: (classId: string) => void;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  selectedClass,
  onChange,
}) => {
  return (
    <SingleSelectCombobox
      options={classes.map((classItem) => ({
        value: classItem.id.toString(),
        label: `${classItem.dars?.title || "بدون نام"} - ${
          classItem.optimized_class_masters?.[0]?.master?.fullname ||
          classItem.optimized_class_masters?.[0]?.users?.fullname ||
          "بدون استاد"
        }`,
      }))}
      value={selectedClass?.id?.toString() || ""}
      onChange={onChange}
      placeholder="انتخاب کلاس"
      className="w-full"
    />
  );
};

export default ClassSelector; 