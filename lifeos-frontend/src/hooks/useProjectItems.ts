import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectItemsApi } from '@/api/projectItems';
import type { ProjectItem, ProjectItemStatus, ProjectItemType } from '@/types';

// All items for one area — used on AreaDetail project board
export function useProjectItems(areaId: string) {
  return useQuery({
    queryKey: ['project-items', areaId],
    queryFn: () => projectItemsApi.list({ areaId }),
    enabled: !!areaId,
  });
}

// All items across all areas — used on cockpit list to show "next action" per area
export function useAllProjectItems() {
  return useQuery({
    queryKey: ['project-items'],
    queryFn: () => projectItemsApi.list(),
  });
}

export function useAddProjectItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      areaId: string;
      title: string;
      type: ProjectItemType;
      status?: ProjectItemStatus;
      notes?: string;
    }) => projectItemsApi.create(data),
    onSuccess: () => {
      // Invalidate with prefix — covers both ['project-items'] and ['project-items', areaId]
      qc.invalidateQueries({ queryKey: ['project-items'] });
    },
  });
}

export function useUpdateProjectItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & Partial<Pick<ProjectItem, 'title' | 'status' | 'type' | 'notes'>>) =>
      projectItemsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-items'] });
    },
  });
}

export function useDeleteProjectItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectItemsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-items'] });
    },
  });
}
