import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  getLatestSoilCard,
  confirmSoilCard,
  deleteSoilCard,
  SoilCardRecord,
  SoilCardConfirmRequest,
  SoilCardConfirmResponse,
} from '../api/soil_card';

export function useSoilCard(customFarmId?: number | null) {
  const { activeFarmId, activeFarm } = useAuth();
  const queryClient = useQueryClient();

  const effectiveFarmId =
    customFarmId !== undefined ? customFarmId : (activeFarmId ?? activeFarm?.id ?? null);

  const queryKey = ['soil-card', effectiveFarmId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!effectiveFarmId) {
        return { has_card: false, card: null };
      }
      return getLatestSoilCard(effectiveFarmId);
    },
    enabled: Boolean(effectiveFarmId),
    staleTime: 1000 * 60 * 5,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: SoilCardConfirmRequest): Promise<SoilCardConfirmResponse> => {
      return confirmSoilCard(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-card'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (farmId: number): Promise<{ success: boolean; message: string }> => {
      return deleteSoilCard(farmId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soil-card'] });
    },
  });

  const card: SoilCardRecord | null = query.data?.card ?? null;
  const hasCard: boolean = Boolean(query.data?.has_card && card);

  return {
    farmId: effectiveFarmId,
    data: query.data,
    card,
    hasCard,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    saveSoilCard: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    deleteSoilCard: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}
