import type { Request, Response, NextFunction } from 'express';
import { createUserClient } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

const SUPABASE_URL = (process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? '').replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? '';

export interface AuthUser {
  id: string;
  role: string;
}

interface SupabaseAuthUser {
  id: string;
}

interface ProfileRow {
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

    const authUser = (await userRes.json()) as SupabaseAuthUser;

    // Query as the authenticated user so RLS allows reading their own profile row
    const userClient = createUserClient(token);
    const { data: profile, error: profileErr } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileErr || !profile) {
      res.status(401).json({ error: 'User profile not found' });
      return;
    }

    const { role } = profile as ProfileRow;
    req.authUser = { id: authUser.id, role };
    next();
  } catch (err: unknown) {
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
