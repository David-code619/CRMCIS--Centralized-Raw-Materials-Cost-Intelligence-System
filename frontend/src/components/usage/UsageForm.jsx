import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, Activity, Plus } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

const usageSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  quantityUsed: z.number().positive('Quantity must be positive'),
});

export function UsageForm({ onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(usageSchema),
  });

  const selectedMaterialId = watch('materialId');

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await apiFetch('/api/inventory');
        if (!res.ok) throw new Error('Failed to fetch inventory');
        const result = await res.json();
        const data = Array.isArray(result) ? result : result.data || [];
        // Extract material info from branchMaterial records
        const formatted = data.map((bm) => ({
          id: bm.materialId,
          name: bm.material.name,
          unit: bm.material.unit,
          currentStock: bm.currentStock
        }));
        setMaterials(formatted);
      } catch (error) {
        addToast('Failed to load inventory', 'error');
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    if (user) fetchMaterials();
  }, [user, addToast]);

  const onSubmit = async (data) => {
    if (!user?.branchId) {
      addToast('User branch not found', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          branchId: user.branchId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to log usage');
      }

      addToast('Usage logged successfully', 'success');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  return (
    <div className="stitch-card p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-success" />
        Log Daily Consumption
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
            <Package className="w-3 h-3" /> Material
          </label>
          <select
            {...register('materialId')}
            className="stitch-input w-full"
            disabled={isLoadingMaterials}
          >
            <option value="">Select Material</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (Stock: {m.currentStock} {m.unit})
              </option>
            ))}
          </select>
          {errors.materialId && (
            <p className="text-[10px] text-danger font-medium">{errors.materialId.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
            Quantity Used {selectedMaterial && `(${selectedMaterial.unit})`}
          </label>
          <input
            type="number"
            step="any"
            {...register('quantityUsed', { valueAsNumber: true })}
            className="stitch-input w-full"
            placeholder="e.g. 5.5"
          />
          {errors.quantityUsed && (
            <p className="text-[10px] text-danger font-medium">{errors.quantityUsed.message}</p>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="stitch-button-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Log Consumption
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
