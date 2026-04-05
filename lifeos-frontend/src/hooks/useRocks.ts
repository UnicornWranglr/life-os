import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rocksApi } from '@/api/rocks';
import { currentQuarter } from '@/utils/dates';
import type { RockStatus } from '@/types';

// Active quarterly rocks for the current quarter
export function useCurrentRocks() {
  const quarter = currentQuarter();
  return useQuery({
    queryKey: ['rocks', quarter],
    queryFn: () => rocksApi.list(quarter),
  });
}

export function useUpdateRock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: RockStatus; notes?: string }) =>
      rocksApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rocks'] });
    },
  });
}
