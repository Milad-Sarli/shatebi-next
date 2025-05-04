import axios from "axios";
import { API_URL } from "@/lib/constants";

export interface Surah {
    id: number;
    place: string;
    type: string;
    count: number;
    title: string;
    titleAr: string;
    index: number;
    pages: string;
    juz: string;
    created_at: string;
    updated_at: string;
}

export interface SurahResponse {
    data: Surah[];
    status: boolean;
}

export class SurahService {
    static async getAllSurahs(token: string): Promise<SurahResponse> {
        const response = await axios.get(`${API_URL}/api/surahs`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }

    static async getSurahById(id: number, token: string): Promise<Surah> {
        const response = await axios.get(`${API_URL}/api/surahs/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    }
} 