/* eslint-disable */
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { OptimizedClass } from "./optimizedClass.service";

export interface StudentActivity {
    id: number;
    student_id: number;
    master_id: number;
    classha_id: number;
    class_absent: boolean;
    provideless: boolean;
    reason?: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    student?: any;
    optimizedClass?: OptimizedClass;
    user?: any;
}

export interface CreateStudentActivityDto {
    student_id: number;
    master_id: number;
    classha_id: number;
    class_absent: boolean;
    provideless: boolean;
    reason?: string;
    user_id: number;
}

export interface UpdateStudentActivityDto extends Partial<CreateStudentActivityDto> { }

export const studentActivityService = {
    async getAll(accessToken: string): Promise<StudentActivity[]> {
        try {
            const response = await axios.get(`${API_URL}/api/student-activities`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data.data;
        } catch (error) {
            console.error("Error in getAll:", error);
            throw error;
        }
    },

    async getById(id: number, accessToken: string): Promise<StudentActivity> {
        const response = await axios.get(`${API_URL}/api/student-activities/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.data;
    },

    async create(data: CreateStudentActivityDto, accessToken: string): Promise<StudentActivity> {
        const response = await axios.post(`${API_URL}/api/student-activities`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.data;
    },

    async update(id: number, data: UpdateStudentActivityDto, accessToken: string): Promise<StudentActivity> {
        const response = await axios.put(`${API_URL}/api/student-activities/${id}`, data, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.data;
    },

    async delete(id: number, accessToken: string): Promise<void> {
        await axios.delete(`${API_URL}/api/student-activities/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
    },

    async getTrashed(accessToken: string): Promise<StudentActivity[]> {
        const response = await axios.get(`${API_URL}/api/student-activities/trashed`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.data;
    },

    async restore(id: number, accessToken: string): Promise<StudentActivity> {
        const response = await axios.post(`${API_URL}/api/student-activities/${id}/restore`, {}, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        return response.data.data;
    },
}; 