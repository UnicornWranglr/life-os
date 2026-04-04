import { useQuery } from '@tanstack/react-query';
import { areasApi } from '@/api/areas';

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: areasApi.list,
  });
}
