import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
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

  const { email, password, role = 'user', is_approved = false } = req.body as {
    email: string;
    password: string;
    role?: 'user' | 'admin';
    is_approved?: boolean;
  };

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  // Create the user
  const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !newUser.user) {
    return res.status(400).json({ error: createError?.message ?? 'Failed to create user' });
  }

  // Update profile (trigger already created it)
  await adminClient
    .from('profiles')
    .update({ role, is_approved })
    .eq('id', newUser.user.id);

  return res.status(200).json({ ok: true, userId: newUser.user.id });
}
