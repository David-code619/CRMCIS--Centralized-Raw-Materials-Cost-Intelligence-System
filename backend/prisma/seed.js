import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🌱 Starting seed...');

  try {

  // 1. Cleanup existing data (skip if tables are empty)
  console.log('🧹 Cleaning up existing data...');
  try {
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.transferApproval.deleteMany();
    await prisma.transfer.deleteMany();
    await prisma.stockAdjustment.deleteMany();
    await prisma.usageLog.deleteMany();
    await prisma.usageBenchmark.deleteMany();
    await prisma.purchase.deleteMany();
    await prisma.branchMaterial.deleteMany();
    await prisma.materialCatalog.deleteMany();
    await prisma.user.deleteMany();
    await prisma.branch.deleteMany();
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('ℹ️  Cleanup skipped (tables might be empty):', error.message);
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 2. Create Branches
  const branches = await Promise.all([
    prisma.branch.create({ data: { name: 'Downtown Bistro', location: '123 Main St, City Center' } }),
    prisma.branch.create({ data: { name: 'Uptown Grill', location: '456 High St, North Side' } }),
    prisma.branch.create({ data: { name: 'Airport Express', location: 'Terminal 2, International Airport' } }),
  ]);

  // 3. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: 'obayidavid02@gmail.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    }
  });

  const branchManager = await prisma.user.create({
    data: {
      email: 'manager@crmcis.com',
      name: 'Branch Manager',
      password: hashedPassword,
      role: 'BRANCH_MANAGER',
      branchId: branches[0].id,
    }
  });

  const inventoryOfficer = await prisma.user.create({
    data: {
      email: 'officer@crmcis.com',
      name: 'Inventory Officer',
      password: hashedPassword,
      role: 'INVENTORY_OFFICER',
      branchId: branches[0].id,
    }
  });

  const managers = [branchManager, ...await Promise.all(branches.slice(1).map((b, i) => 
    prisma.user.create({
      data: {
        email: `manager${i+2}@crmcis.com`,
        name: `${b.name} Manager`,
        password: hashedPassword,
        role: 'BRANCH_MANAGER',
        branchId: b.id,
      }
    })
  ))];

  const officers = [inventoryOfficer, ...await Promise.all(branches.slice(1).map((b, i) => 
    prisma.user.create({
      data: {
        email: `officer${i+2}@crmcis.com`,
        name: `${b.name} Officer`,
        password: hashedPassword,
        role: 'INVENTORY_OFFICER',
        branchId: b.id,
      }
    })
  ))];

  // 4. Create Material Catalog
  const materialsData = [
    { name: 'Chicken Breast', category: 'Meat', unit: 'kg' },
    { name: 'Beef Ribeye', category: 'Meat', unit: 'kg' },
    { name: 'Salmon Fillet', category: 'Seafood', unit: 'kg' },
    { name: 'Whole Milk', category: 'Dairy', unit: 'liters' },
    { name: 'Cheddar Cheese', category: 'Dairy', unit: 'kg' },
    { name: 'Butter', category: 'Dairy', unit: 'kg' },
    { name: 'Potatoes', category: 'Vegetables', unit: 'kg' },
    { name: 'Tomatoes', category: 'Vegetables', unit: 'kg' },
    { name: 'Onions', category: 'Vegetables', unit: 'kg' },
    { name: 'Lettuce', category: 'Vegetables', unit: 'heads' },
    { name: 'Cooking Oil', category: 'Pantry', unit: 'liters' },
    { name: 'Flour', category: 'Pantry', unit: 'kg' },
    { name: 'Sugar', category: 'Pantry', unit: 'kg' },
    { name: 'Paper Napkins', category: 'Supplies', unit: 'packs' },
  ];

  // 4. Create Material Catalog (in batches)
  console.log('📦 Creating materials...');
  const batchSize = 5;
  for (let i = 0; i < materialsData.length; i += batchSize) {
    const batch = materialsData.slice(i, i + batchSize);
    await Promise.all(batch.map(m => prisma.materialCatalog.create({ data: m })));
    console.log(`   Created materials ${i + 1}-${Math.min(i + batchSize, materialsData.length)}`);
  }
  const materials = await prisma.materialCatalog.findMany();

  // 5. Setup Branch Materials & Benchmarks
  for (const branch of branches) {
    for (const material of materials) {
      // Activate material for branch
      await prisma.branchMaterial.create({
        data: {
          branchId: branch.id,
          materialId: material.id,
          reorderThreshold: 10 + Math.random() * 20,
          currentStock: 0,
          avgCost: 0,
        }
      });

      // Create Benchmark
      await prisma.usageBenchmark.create({
        data: {
          branchId: branch.id,
          materialId: material.id,
          expectedUsage: 5 + Math.random() * 15,
          threshold: 0.15, // 15%
        }
      });
    }
  }

  // 6. Generate Transactions (Last 30 days)
  const now = new Date();
  for (let i = 15; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    for (const branch of branches) {
      const officer = officers.find(o => o.branchId === branch.id);
      const manager = managers.find(m => m.branchId === branch.id);

      if (!officer || !manager) continue;

      for (const material of materials) {
        // A. Purchases (Occasional)
        if (i % 7 === 0) {
          const qty = 50 + Math.random() * 100;
          const unitPrice = 5 + Math.random() * 10;
          
          await prisma.purchase.create({
            data: {
              branchId: branch.id,
              materialId: material.id,
              quantity: qty,
              unitPrice: unitPrice,
              totalCost: qty * unitPrice,
              supplier: 'Global Food Services',
              invoiceRef: `INV-${Math.floor(Math.random() * 100000)}`,
              purchaseDate: date,
              loggedById: officer.id,
            }
          });

          // Update BranchMaterial (Simplified WAC for seed)
          const bm = await prisma.branchMaterial.findUnique({ where: { branchId_materialId: { branchId: branch.id, materialId: material.id } } });
          const totalQty = bm.currentStock + qty;
          const newAvgCost = totalQty > 0 ? ((bm.currentStock * bm.avgCost) + (qty * unitPrice)) / totalQty : unitPrice;
          
          await prisma.branchMaterial.update({
            where: { id: bm.id },
            data: {
              currentStock: { increment: qty },
              avgCost: newAvgCost,
            }
          });
        }

        // B. Usage (Daily)
        const benchmark = await prisma.usageBenchmark.findUnique({ where: { branchId_materialId: { branchId: branch.id, materialId: material.id } } });
        
        // Randomly introduce suspicious usage (variance > 15%)
        const isSuspiciousDay = Math.random() > 0.9;
        const varianceFactor = isSuspiciousDay ? (1.2 + Math.random() * 0.5) : (0.8 + Math.random() * 0.4);
        const qtyUsed = benchmark.expectedUsage * varianceFactor;
        const varianceAmount = qtyUsed - benchmark.expectedUsage;
        const isSuspicious = Math.abs(varianceAmount / benchmark.expectedUsage) > benchmark.threshold;

        const bm = await prisma.branchMaterial.findUnique({ where: { branchId_materialId: { branchId: branch.id, materialId: material.id } } });
        if (bm.currentStock >= qtyUsed) {
          await prisma.usageLog.create({
            data: {
              branchId: branch.id,
              materialId: material.id,
              quantityUsed: qtyUsed,
              usageDate: date,
              loggedById: officer.id,
              isSuspicious,
              varianceAmount,
            }
          });

          await prisma.branchMaterial.update({
            where: { id: bm.id },
            data: { currentStock: { decrement: qtyUsed } }
          });
        }

        // C. Adjustments (Occasional)
        if (Math.random() > 0.95) {
          const adjQty = -(1 + Math.random() * 5); // Loss/Waste
          await prisma.stockAdjustment.create({
            data: {
              branchId: branch.id,
              materialId: material.id,
              quantity: adjQty,
              reason: Math.random() > 0.5 ? 'WASTE' : 'LOSS',
              notes: 'End of day spoilage',
              status: 'APPROVED',
              adjustmentDate: date,
              loggedById: officer.id,
              approvedById: manager.id,
            }
          });

          await prisma.branchMaterial.update({
            where: { branchId_materialId: { branchId: branch.id, materialId: material.id } },
            data: { currentStock: { increment: adjQty } }
          });
        }
      }
    }
  }

  // 7. Create some Transfers
  console.log('📦 Creating transfers...');
  for (let j = 0; j < 5; j++) {
    const from = branches[0];
    const to = branches[1];
    const mat = materials[j];
    const qty = 10;

    const transfer = await prisma.transfer.create({
      data: {
        fromBranchId: from.id,
        toBranchId: to.id,
        materialId: mat.id,
        quantity: qty,
        status: 'APPROVED',
        loggedById: officers[0].id,
        notes: 'Urgent stock needed',
      }
    });

    await prisma.transferApproval.create({
      data: {
        transferId: transfer.id,
        approvedById: superAdmin.id,
        status: 'APPROVED',
        notes: 'Approved by HQ',
      }
    });
  }

  console.log('✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
