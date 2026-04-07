import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Package, DollarSign, User, FileText, Calendar } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const purchaseSchema = z.object({
  materialId: z.string().min(1, 'Material is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  supplier: z.string().optional(),
  invoiceRef: z.string().optional(),
  purchaseDate: z.string().optional(),
  branchId: z.string().optional(),
});

export function PurchaseForm({ onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(true);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      purchaseDate: new Date().toISOString().split('T')[0],
      branchId: user?.branchId || '',
    },
  });

  const selectedMaterialId = watch('materialId');
  const selectedBranchId = watch('branchId');
  const quantity = watch('quantity') || 0;
  const unitPrice = watch('unitPrice') || 0;
  const totalCost = quantity * unitPrice;

  useEffect(() => {
    async function fetchData() {
      try {
        const [matRes, branchRes] = await Promise.all([
          fetch('/api/materials', { credentials: 'include' }),
          user?.role === 'SUPER_ADMIN' ? fetch('/api/branches', { credentials: 'include' }) : Promise.resolve(null)
        ]);

        if (!matRes.ok) throw new Error('Failed to fetch materials');
        const matResult = await matRes.json();
        setMaterials(Array.isArray(matResult) ? matResult : matResult.data || []);

        if (branchRes) {
          if (!branchRes.ok) throw new Error('Failed to fetch branches');
          const branchResult = await branchRes.json();
          setBranches(branchResult);
        }
      } catch (error) {
        addToast('Failed to load data', 'error');
      } finally {
        setIsLoadingMaterials(false);
      }
    }
    fetchData();
  }, [addToast, user?.role]);

  const onSubmit = async (data) => {
    const branchId = user?.role === 'SUPER_ADMIN' ? data.branchId : user?.branchId;
    
    if (!branchId) {
      addToast('Branch is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          branchId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log purchase');
      }

      addToast('Purchase logged successfully', 'success');
      reset({
        purchaseDate: new Date().toISOString().split('T')[0],
        branchId: user?.branchId || '',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      addToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="stitch-card p-6">
      <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        Log New Purchase
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Selection (Super Admin only) */}
          {user?.role === 'SUPER_ADMIN' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
                Branch
              </label>
              <select
                {...register('branchId')}
                className="stitch-input w-full"
              >
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {errors.branchId && (
                <p className="text-[10px] text-danger font-medium">{errors.branchId.message}</p>
              )}
            </div>
          )}

          {/* Material Selection */}
          <div className={cn("space-y-1.5", user?.role !== 'SUPER_ADMIN' && "md:col-span-2")}>
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

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Purchase Date
            </label>
            <input
              type="date"
              {...register('purchaseDate')}
              className="stitch-input w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
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

          {/* Unit Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Unit Price
            </label>
            <input
              type="number"
              step="any"
              {...register('unitPrice', { valueAsNumber: true })}
              className="stitch-input w-full"
              placeholder="0.00"
            />
            {errors.unitPrice && (
              <p className="text-[10px] text-danger font-medium">{errors.unitPrice.message}</p>
            )}
          </div>

          {/* Total Cost (Read-only) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
              Total Cost
            </label>
            <div className="stitch-input w-full bg-background/50 font-bold text-primary flex items-center">
              ₦ {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <User className="w-3 h-3" /> Supplier Name
            </label>
            <input
              type="text"
              {...register('supplier')}
              className="stitch-input w-full"
              placeholder="e.g. Fresh Farms Ltd"
            />
          </div>

          {/* Invoice Reference */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary flex items-center gap-1">
              <FileText className="w-3 h-3" /> Invoice Reference
            </label>
            <input
              type="text"
              {...register('invoiceRef')}
              className="stitch-input w-full"
              placeholder="e.g. INV-2026-001"
            />
          </div>
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
                Logging Purchase...
              </>
            ) : (
              'Log Purchase'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
