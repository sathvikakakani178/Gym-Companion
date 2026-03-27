import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const SUPABASE_URL = (process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] || '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_URL'] || '';

export interface AuthUser {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers['authorization']?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  try {
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': SUPABASE_ANON_KEY,
      },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const authUser = (await userRes.json()) as { id: string };

    const { data: dbUser, error: dbErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (dbErr || !dbUser) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.authUser = { id: authUser.id, role: (dbUser as any).role };
    next();
  } catch (err) {
    logger.error({ err }, 'Auth middleware error');
    res.status(500).json({ error: 'Authentication error' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}
