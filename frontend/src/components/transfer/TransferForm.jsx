import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, ArrowRightLeft, FileText, Plus, Building2 } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

const transferSchema = z.object({
  fromBranchId: z.string().min(1, 'Source branch is required'),
  toBranchId: z.string().min(1, 'Destination branch is required'),
  materialId: z.string().min(1, 'Material is required'),
  quantity: z.number().positive('Quantity must be greater than zero'),
  notes: z.string().optional(),
}).refine(data => data.fromBranchId !== data.toBranchId, {
  message: "Source and destination branches cannot be the same",
  path: ["toBranchId"],
});

export function TransferForm({ onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [branches, setBranches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromBranchId: user?.branchId || '',
    }
  });

  const selectedMaterialId = watch('materialId');

  useEffect(() => {
    async function fetchData() {
      try {
        const [branchesRes, materialsRes] = await Promise.all([
          apiFetch('/api/branches'),
          apiFetch('/api/materials')
        ]);
        
        if (!branchesRes.ok || !materialsRes.ok) throw new Error('Failed to fetch data');
        
        const [branchesData, materialsData] = await Promise.all([
          branchesRes.json(),
          materialsRes.json()
        ]);
        
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.data || []);
        setMaterials(Array.isArray(materialsData) ? materialsData : materialsData.data || []);
      } catch (error) {
        addToast('Failed to load form data', 'error');
        setBranches([]);
        setMaterials([]);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [addToast]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transfer request');
      }

      addToast('Transfer request created successfully', 'success');
      reset({ fromBranchId: user?.branchId || '' });
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
        <ArrowRightLeft className="w-5 h-5 text-primary" />
        Request Inter-Branch Transfer
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Source Branch
            </label>
            <select
              {...register('fromBranchId')}
              className="stitch-input w-full"
              disabled={user?.role !== 'SUPER_ADMIN'}
            >
              <option value="">Select Source</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.fromBranchId && (
              <p className="text-[10px] text-danger font-medium">{errors.fromBranchId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Destination Branch
            </label>
            <select
              {...register('toBranchId')}
              className="stitch-input w-full"
            >
              <option value="">Select Destination</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.toBranchId && (
              <p className="text-[10px] text-danger font-medium">{errors.toBranchId.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <Package className="w-3 h-3" /> Material
            </label>
            <select
              {...register('materialId')}
              className="stitch-input w-full"
              disabled={isLoadingData}
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Quantity {selectedMaterial && `(${selectedMaterial.unit})`}
            </label>
            <input
              type="number"
              step="any"
              {...register('quantity', { valueAsNumber: true })}
              className="stitch-input w-full"
              placeholder="0.00"
            />
            {errors.quantity && (
              <p className="text-[10px] text-danger font-medium">{errors.quantity.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
            <FileText className="w-3 h-3" /> Transfer Notes
          </label>
          <textarea
            {...register('notes')}
            className="stitch-input w-full min-h-20 py-3"
            placeholder="Reason for transfer, urgency, etc..."
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
                Submitting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Submit Transfer Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
