import 'dotenv/config';
import { prisma } from './lib/prisma.js';

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();