import { api } from '@/lib/api';
import type { Location } from '@/types/location';

export async function listLocations(): Promise<Location[]> {
  const { data } = await api.get<{ data: Location[] }>('/locations');
  return data.data;
}

export async function createLocation(payload: { name: string; address: string }): Promise<Location> {
  const { data } = await api.post<Location>('/locations', payload);
  return data;
}
