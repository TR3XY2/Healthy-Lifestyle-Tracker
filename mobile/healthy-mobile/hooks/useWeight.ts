import { useState, useEffect } from "react";
import { getWeightHistory, addWeight, deleteWeight } from "../api/weight.api";
import { WeightRecord, WeightCreateDto } from "../types/weight";

export function useWeight() {
  const [weights, setWeights] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeights = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeightHistory();
      setWeights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weights");
      console.error("Error fetching weights:", err);
    } finally {
      setLoading(false);
    }
  };

  const add = async (dto: WeightCreateDto) => {
    try {
      const newRecord = await addWeight(dto);
      await fetchWeights(); // Refresh the list
      return newRecord;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add weight");
      throw err;
    }
  };

  const remove = async (date: string) => {
    try {
      await deleteWeight(date);
      await fetchWeights(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete weight");
      throw err;
    }
  };

  useEffect(() => {
    fetchWeights();
  }, []);

  return {
    weights,
    loading,
    error,
    add,
    remove,
    refresh: fetchWeights,
  };
}
