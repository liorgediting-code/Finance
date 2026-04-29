import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;

  // Verify caller is an admin
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) return res.status(401).json({ error: 'Invalid token' });

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden — admins only' });
  }

  const { userId, updates } = req.body as { userId: string; updates: Record<string, unknown> };
  if (!userId || !updates) return res.status(400).json({ error: 'userId and updates required' });

  // Only allow updating safe profile fields — never role, id, created_at, etc.
  const ALLOWED_FIELDS = new Set(['is_approved']);
  const safeUpdates: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    if (ALLOWED_FIELDS.has(key)) safeUpdates[key] = updates[key];
  }
  if (Object.keys(safeUpdates).length === 0) {
    return res.status(400).json({ error: 'No allowed fields to update' });
  }

  const { error } = await adminClient
    .from('profiles')
    .update(safeUpdates)
    .eq('id', userId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
