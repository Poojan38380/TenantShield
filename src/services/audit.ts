import { Request } from 'express';
import prisma from '../config/prisma.ts';
import { TenantContextRequest } from '../middleware/tenant.ts';

type ActorType = 'USER' | 'API_KEY';

interface AuditParams {
  action: string;
  success: boolean;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any> | null;
  organizationId?: string | null;
  actorType?: ActorType;
  actorId?: string;
}

const getIp = (req: Request): string => {
  const xfwd = (req.headers['x-forwarded-for'] as string) || '';
  return (xfwd.split(',')[0] || req.ip || (req.socket && (req.socket as any).remoteAddress) || 'unknown').trim();
};

export const logAudit = async (req: Request, params: AuditParams): Promise<void> => {
  try {
    const tReq = req as TenantContextRequest & any;

    // Derive org and actor from multiple sources
    const user = tReq.user as any | undefined;
    const apiKey = tReq.apiKey as any | undefined;

    const derivedOrgId = params.organizationId ?? tReq.tenantId ?? user?.organizationId ?? apiKey?.organizationId ?? null;
    const actorType: ActorType = params.actorType ?? (user ? 'USER' : (apiKey ? 'API_KEY' : 'USER'));
    const actorId: string = params.actorId ?? (user?.userId || apiKey?.keyId || 'anonymous');

    await prisma.auditLog.create({
      data: {
        organizationId: derivedOrgId || undefined,
        actorType,
        actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        success: params.success,
        ip: getIp(req),
        userAgent: req.get('User-Agent') || undefined,
        metadata: params.metadata ?? undefined,
      },
    });
  } catch (err) {
    // Never throw from audit logger; just warn
    console.warn('Audit log failed:', err);
  }
};


