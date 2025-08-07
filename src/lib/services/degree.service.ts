import axios from 'axios';
import { API_URL } from '@/lib/constants';

export interface Student {
  id: number;
  Fname: string;
  Lname: string;
}

export interface DegreeItem {
  id: number;
  degree_id: number;
  student_id: number;
  degree: string;
  number: string;
  created_at: string | null;
  updated_at: string | null;
  student: Student;
}

export interface Degree {
  id: number;
  name?: string;
  year: number;
  month: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: DegreeItem[];
}

const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    const errorMessage = error.response?.data?.message || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

export class DegreeService {
  static async getAllDegrees(token: string): Promise<Degree[]> {
    const response = await axiosInstance.get('/api/degrees', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  }

  static async getDegreeById(id: string, token: string): Promise<Degree> {
    const response = await axiosInstance.get(`/api/degrees/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  }

  static async createDegrees(month: number, year: number, token: string): Promise<Degree> {
    const response = await axiosInstance.post('/api/degrees',
      { month, year },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return response.data;
  }
}