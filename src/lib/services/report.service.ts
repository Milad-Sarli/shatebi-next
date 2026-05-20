import { API_URL } from '@/lib/constants';

export interface LessonAreaInfo {
  start_page: number | null;
  end_page: number | null;
  start_surah: { id: number; title: string; titleAr: string } | null;
  end_surah: { id: number; title: string; titleAr: string } | null;
  start_verse: number | null;
  end_verse: number | null;
  start_joze: number | null;
  end_joze: number | null;
}

export interface GradeItem {
  id: number;
  date: string;
  jalali_date: string;
  hefz: number | null;
  details: number | null;
  tajvid: number | null;
  sout: number | null;
  number: number | null;
  total: number;
  practice_count: number | null;
  description: string | null;
  dars: { id: number; title: string } | null;
  master: string | null;
  lesson_area: LessonAreaInfo | null;
}

export interface ProgressByLesson {
  lesson: { id: number; title: string };
  total_grades: number;
  avg_hefz: number;
  avg_details: number;
  avg_tajvid: number;
  avg_sout: number;
  avg_total: number;
  min_score: number;
  max_score: number;
  first_date: string;
  last_date: string;
  first_area: LessonAreaInfo | null;
  last_area: LessonAreaInfo | null;
}

export interface ScoreTrend {
  date: string;
  jalali_date: string;
  avg_score: number;
  count: number;
}

export interface StudentProgressResponse {
  student: {
    id: number;
    fname: string;
    lname: string;
    father_name: string;
    student_code: string;
    phone: string;
    parent_phone: string;
    aks: string | null;
    status: string;
    juz: string | null;
    entry_date: string | null;
  };
  grades: GradeItem[];
  progress_by_lesson: ProgressByLesson[];
  score_trend: ScoreTrend[];
  attendance: {
    total: number;
    absents: number;
    provideless: number;
    attendance_rate: number | null;
  };
  week_absent_stats: {
    total_days: number;
    absent_days: number;
    delay_days: number;
    present_days: number;
  } | null;
  pages_by_lesson: {
    lesson_id: number;
    lesson_title: string;
    parent_title: string | null;
    total_pages: number;
    total_grades: number;
  }[];
}

export interface ContentStudent {
  student: {
    id: number;
    fname: string;
    lname: string;
    father_name: string;
    student_code: string;
    phone: string;
    status: string;
  };
  grades: {
    id: number;
    date: string;
    jalali_date: string;
    hefz: number | null;
    number: number | null;
    total: number;
    dars: string | null;
    master: string | null;
    lesson_area: LessonAreaInfo | null;
  }[];
  total_grades: number;
  avg_score: number;
}

export interface ContentProgressResponse {
  students: ContentStudent[];
  total_students: number;
  total_grades: number;
  matched_lesson_areas: (LessonAreaInfo & { dars: string | null })[];
}

export interface OverviewResponse {
  total_grades: number;
  avg_score: number;
  negative_count: number;
  active_students: number;
  top_students: {
    student_id: number;
    student_name: string;
    grade_count: number;
    avg_score: number;
  }[];
  lesson_breakdown: {
    lesson: string;
    count: number;
    avg_score: number;
  }[];
}

export const reportService = {
  async getStudentProgress(
    studentId: number,
    params: { start_date?: string; end_date?: string; droos_id?: number },
    accessToken: string
  ): Promise<StudentProgressResponse> {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    if (params.droos_id) queryParams.append('droos_id', params.droos_id.toString());

    const response = await fetch(
      `${API_URL}/api/reports/student-progress/${studentId}?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch student progress');
    return response.json();
  },

  async getContentProgress(
    params: {
      start_date?: string;
      end_date?: string;
      droos_id?: number;
      start_page?: number;
      end_page?: number;
      start_surah?: number;
      end_surah?: number;
      start_joze?: number;
      end_joze?: number;
    },
    accessToken: string
  ): Promise<ContentProgressResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${API_URL}/api/reports/content-progress?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch content progress');
    return response.json();
  },

  async getOverview(
    params: { start_date?: string; end_date?: string },
    accessToken: string
  ): Promise<OverviewResponse> {
    const queryParams = new URLSearchParams();
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);

    const response = await fetch(
      `${API_URL}/api/reports/overview?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }
    );
    if (!response.ok) throw new Error('Failed to fetch overview');
    return response.json();
  },
};
