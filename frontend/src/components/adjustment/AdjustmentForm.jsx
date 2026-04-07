import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, AlertTriangle, FileText, Plus } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';

const adjustmentSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  quantity: z.number().refine(val => val !== 0, 'Quantity cannot be zero'),
  reason: z.enum(['WASTE', 'LOSS', 'CORRECTION', 'DAMAGE', 'EXPIRATION', 'OTHER']),
  notes: z.string().optional(),
});

export function AdjustmentForm({ onSuccess }) {
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
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      reason: 'WASTE',
    }
  });

  const selectedMaterialId = watch('materialId');

  useEffect(() => {
    async function fetchMaterials() {
      try {
        const res = await fetch('/api/materials', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch materials');
        const result = await res.json();
        setMaterials(Array.isArray(result) ? result : result.data || []);
      } catch (error) {
        addToast('Failed to load materials', 'error');
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    fetchMaterials();
  }, [addToast]);

  const onSubmit = async (data) => {
    if (!user?.branchId && user?.role !== 'SUPER_ADMIN') {
      addToast('User branch not found', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          branchId: user.branchId,
        }),
      });

      if (!response.ok) throw new Error('Failed to record adjustment');

      addToast('Adjustment recorded and pending approval', 'success');
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
        <AlertTriangle className="w-5 h-5 text-warning" />
        Record Stock Adjustment
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
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
          {errors.materialId && (
            <p className="text-[10px] text-danger font-medium">{errors.materialId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Quantity {selectedMaterial && `(${selectedMaterial.unit})`}
            </label>
            <input
              type="number"
              step="any"
              {...register('quantity', { valueAsNumber: true })}
              className="stitch-input w-full"
              placeholder="e.g. -5.5 for loss"
            />
            <p className="text-[10px] text-text-tertiary mt-1 italic">Use negative for waste/loss, positive for correction.</p>
            {errors.quantity && (
              <p className="text-[10px] text-danger font-medium">{errors.quantity.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Reason
            </label>
            <select {...register('reason')} className="stitch-input w-full">
              <option value="WASTE">WASTE</option>
              <option value="LOSS">LOSS</option>
              <option value="CORRECTION">CORRECTION</option>
              <option value="DAMAGE">DAMAGE</option>
              <option value="EXPIRATION">EXPIRATION</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
            <FileText className="w-3 h-3" /> Notes / Justification
          </label>
          <textarea
            {...register('notes')}
            className="stitch-input w-full min-h-[100px] py-3"
            placeholder="Describe why this adjustment is necessary..."
          />
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
                Recording...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Submit for Approval
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
