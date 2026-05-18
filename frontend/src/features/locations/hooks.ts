import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listLocations, createLocation } from './api';

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: listLocations,
    staleTime: 5 * 60_000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
