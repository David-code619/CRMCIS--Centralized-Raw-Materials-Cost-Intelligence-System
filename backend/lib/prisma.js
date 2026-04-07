/**
 * Prisma Client Instance
 * 
 * This file ensures a single instance of PrismaClient is used throughout the application.

 */

import 'dotenv/config'
import pkg from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const { PrismaClient } = pkg

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
})

export const prisma = new PrismaClient({ adapter })


