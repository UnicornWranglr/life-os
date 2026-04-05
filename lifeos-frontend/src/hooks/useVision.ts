import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visionApi } from '@/api/vision';

export function useVision() {
  return useQuery({
    queryKey: ['vision'],
    queryFn: visionApi.get,
  });
}

export function useSaveVision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statement: string) => visionApi.update(statement),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vision'] }),
  });
}
