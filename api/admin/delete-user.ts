import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
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

  const { userId } = req.body as { userId: string };
  if (!userId) return res.status(400).json({ error: 'userId required' });

  if (userId === caller.id) {
    return res.status(400).json({ error: 'לא ניתן למחוק את עצמך' });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ ok: true });
}
