import { prisma } from '../config/database';
import type { 
  QueryOptions, 
  PaginatedResponse, 
  AuditContext,
  DatabaseTransaction 
} from '../types/database';

/**
 * Execute database operations with automatic retry and error handling
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Execute database transaction with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx);
  });
}

/**
 * Create paginated query with optimized performance
 */
export async function paginate<T>(
  model: any,
  options: QueryOptions = {}
): Promise<PaginatedResponse<T>> {
  const {
    page = 1,
    limit = 10,
    orderBy = { createdAt: 'desc' },
    where = {}
  } = options;

  const skip = (page - 1) * limit;
  
  // Execute count and data queries in parallel for better performance
  const [total, data] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    })
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Log audit events for security and compliance
 */
export async function logAudit(context: AuditContext): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: context.action,
        resource: context.resource,
        details: context.details,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        userId: context.userId,
        tenantId: context.tenantId,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Soft delete utility that maintains referential integrity
 */
export async function softDelete(
  model: any,
  id: string,
  tenantId?: string
): Promise<boolean> {
  try {
    const where = tenantId ? { id, tenantId } : { id };
    
    await model.update({
      where,
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    return true;
  } catch (error) {
    console.error('Soft delete failed:', error);
    return false;
  }
}

/**
 * Bulk operations with optimized batch processing
 */
export async function bulkCreate<T>(
  model: any,
  data: T[],
  batchSize: number = 100
): Promise<number> {
  let totalCreated = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    const result = await model.createMany({
      data: batch,
      skipDuplicates: true,
    });
    
    totalCreated += result.count;
  }
  
  return totalCreated;
}

/**
 * Database health check for monitoring
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  details?: string;
}> {
  const start = Date.now();
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    
    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - start;
    
    return {
      status: 'unhealthy',
      latency,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Clean up expired records for maintenance
 */
export async function cleanupExpiredRecords(): Promise<{
  apiKeys: number;
  auditLogs: number;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const [expiredApiKeys, oldAuditLogs] = await Promise.all([
    // Remove expired API keys
    prisma.apiKey.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    }),
    
    // Remove audit logs older than 30 days (adjust as needed)
    prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    }),
  ]);
  
  return {
    apiKeys: expiredApiKeys.count,
    auditLogs: oldAuditLogs.count,
  };
}
