import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intentionsApi } from '@/api/intentions';
import type { IntentionStatus } from '@/types';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useCurrentIntentions() {
  const month = currentMonth();
  return useQuery({
    queryKey: ['intentions', month],
    queryFn: () => intentionsApi.list(month),
  });
}

export function useAddIntention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { areaId: string; title: string }) =>
      intentionsApi.create({ ...data, month: currentMonth() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intentions'] }),
  });
}

export function useUpdateIntention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; status?: IntentionStatus }) =>
      intentionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intentions'] }),
  });
}

export function useDeleteIntention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intentionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intentions'] }),
  });
}
