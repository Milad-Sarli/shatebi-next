import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Custom debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// Helper function to identify reading classes
export const isReadingClass = (courseTitle: string): boolean => {
  const readingKeywords = ['روخوانی', 'قرائت', 'خواندن', 'reading'];
  return readingKeywords.some(keyword => 
    courseTitle.toLowerCase().includes(keyword.toLowerCase())
  );
};

// Helper function to format lesson range
import { Grade } from '@/lib/services/optimizedClass.service';
export const formatLessonRange = (grade: Grade): string => {
  const lessonArea = grade.lesson_area;
  if (!lessonArea) return "";
  // Page-based range
  if (lessonArea.start_page && lessonArea.end_page) {
    return `صفحات ${lessonArea.start_page} تا ${lessonArea.end_page}`;
  }
  // Surah and verse range
  if (lessonArea.start_surah && lessonArea.end_surah) {
    const startSurahName = lessonArea.start_surah.titleAr || lessonArea.start_surah.title;
    const endSurahName = lessonArea.end_surah.titleAr || lessonArea.end_surah.title;
    if (lessonArea.start_verse && lessonArea.end_verse) {
      if (lessonArea.start_surah.id === lessonArea.end_surah.id) {
        return `${startSurahName} آیات ${lessonArea.start_verse} تا ${lessonArea.end_verse}`;
      } else {
        return `${startSurahName} آیه ${lessonArea.start_verse} تا ${endSurahName} آیه ${lessonArea.end_verse}`;
      }
    } else {
      if (lessonArea.start_surah.id === lessonArea.end_surah.id) {
        return `${startSurahName}`;
      } else {
        return `${startSurahName} تا ${endSurahName}`;
      }
    }
  }
  // Joze (part) range
  if (lessonArea.start_joze && lessonArea.end_joze) {
    if (lessonArea.start_joze === lessonArea.end_joze) {
      return `جز ${lessonArea.start_joze}`;
    } else {
      return `جز ${lessonArea.start_joze} تا ${lessonArea.end_joze}`;
    }
  }
  return "";
};
