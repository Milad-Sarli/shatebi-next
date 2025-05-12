import axios from 'axios';
import { API_URL } from '@/lib/constants';

export interface Province {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

export interface City {
    id: number;
    name: string;
    province_id: number;
    created_at: string;
    updated_at: string;
}

export interface CreateProvinceDto {
    name: string;
}

export interface UpdateProvinceDto {
    name: string;
}

export interface CreateCityDto {
    name: string;
    province_id: number;
}

export interface UpdateCityDto {
    name: string;
    province_id: number;
}

class LocationService {
    // Province endpoints
    async getAllProvinces(): Promise<Province[]> {
        const response = await axios.get(`${API_URL}/api/provinces`);
        return response.data;
    }

    async getProvince(id: number): Promise<Province> {
        const response = await axios.get(`${API_URL}/api/provinces/${id}`);
        return response.data;
    }

    async createProvince(data: CreateProvinceDto): Promise<Province> {
        const response = await axios.post(`${API_URL}/api/provinces`, data);
        return response.data;
    }

    async updateProvince(id: number, data: UpdateProvinceDto): Promise<Province> {
        const response = await axios.put(`${API_URL}/api/provinces/${id}`, data);
        return response.data;
    }

    async deleteProvince(id: number): Promise<void> {
        await axios.delete(`${API_URL}/api/provinces/${id}`);
    }

    // City endpoints
    async getAllCities(): Promise<City[]> {
        const response = await axios.get(`${API_URL}/api/cities`);
        return response.data;
    }

    async getCity(id: number): Promise<City> {
        const response = await axios.get(`${API_URL}/api/cities/${id}`);
        return response.data;
    }

    async createCity(data: CreateCityDto): Promise<City> {
        const response = await axios.post(`${API_URL}/api/cities`, data);
        return response.data;
    }

    async updateCity(id: number, data: UpdateCityDto): Promise<City> {
        const response = await axios.put(`${API_URL}/api/cities/${id}`, data);
        return response.data;
    }

    async deleteCity(id: number): Promise<void> {
        await axios.delete(`${API_URL}/api/cities/${id}`);
    }

    async getCitiesByProvince(provinceId: number): Promise<City[]> {
        const response = await axios.get(`${API_URL}/api/cities/province/${provinceId}`);
        return response.data;
    }
}

export const locationService = new LocationService(); 