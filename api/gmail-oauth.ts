import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const { code, codeVerifier, redirectUri } = req.body as {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  };
  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'code, codeVerifier, and redirectUri required' });
  }

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

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json();
    return res.status(400).json({ error: err.error_description ?? 'Token exchange failed' });
  }

  const tokens = await tokenRes.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = userInfoRes.ok ? await userInfoRes.json() : {};

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { error: upsertError } = await adminClient.from('user_gmail_tokens').upsert({
    user_id: user.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    gmail_email: userInfo.email ?? null,
  });

  if (upsertError) return res.status(500).json({ error: 'Failed to store tokens' });

  return res.status(200).json({
    accessToken: tokens.access_token,
    expiresAt,
    gmailEmail: userInfo.email ?? null,
  });
}
