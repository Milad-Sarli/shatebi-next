import { API_URL } from '@/lib/constants';

export interface CountyData {
  id: number;
  name: string;
  [key: string]: unknown; // For any additional fields returned by the API
}

export class DashboardService {
  static async getCountyData(token: string): Promise<CountyData[]> {
    const response = await fetch(`${API_URL}/api/dashboard/county-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch county data: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // If the API returns { data: [...] }, return data.data, else return data
    return data;
  }
}
