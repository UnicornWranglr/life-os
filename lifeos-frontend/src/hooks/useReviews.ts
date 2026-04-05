import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '@/api/reviews';
import type { WeeklyReview } from '@/types';

// All reviews ordered desc — list + current week detection done client-side
export function useAllReviews() {
  return useQuery({
    queryKey: ['reviews'],
    queryFn: reviewsApi.list,
  });
}

// Upsert via PUT — backend creates if missing, updates if exists
export function useSaveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WeeklyReview, 'id' | 'userId' | 'createdAt'>) =>
      reviewsApi.update(data.weekStart, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
