import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: tokenRow } = await adminClient
    .from('user_gmail_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .single();

  if (!tokenRow?.refresh_token) return res.status(404).json({ error: 'No refresh token found' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokenRow.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenRes.ok) {
    await adminClient.from('user_gmail_tokens').delete().eq('user_id', user.id);
    return res.status(400).json({ error: 'Refresh failed — user must reconnect' });
  }

  const tokens = await tokenRes.json() as { access_token: string; expires_in: number };
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await adminClient.from('user_gmail_tokens').update({
    access_token: tokens.access_token,
    expires_at: expiresAt,
  }).eq('user_id', user.id);

  return res.status(200).json({ accessToken: tokens.access_token, expiresAt });
}
