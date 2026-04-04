import { useQuery } from '@tanstack/react-query';
import { visionApi } from '@/api/vision';

export function useVision() {
  return useQuery({
    queryKey: ['vision'],
    queryFn: visionApi.get,
  });
}
