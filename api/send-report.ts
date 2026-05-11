import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const supabaseToken = authHeader.slice(7);

  const {
    toEmail,
    toName,
    periodLabel,
    csvBase64,
    pdfBase64,
  } = req.body as {
    toEmail: string;
    toName: string;
    periodLabel: string;
    csvBase64: string;
    pdfBase64: string;
  };

  if (!toEmail || !csvBase64) return res.status(400).json({ error: 'toEmail and csvBase64 required' });

  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!;
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Invalid token' });

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const attachments: Array<{ filename: string; content: string }> = [
    { filename: `vat-report-${periodLabel}.csv`, content: csvBase64 },
  ];
  if (pdfBase64) {
    attachments.push({ filename: `vat-report-${periodLabel}.pdf`, content: pdfBase64 });
  }

  const { error } = await resend.emails.send({
    from: process.env.REPORT_FROM_EMAIL ?? 'reports@example.com',
    to: toEmail,
    subject: `VAT Report ${periodLabel}`,
    html: `<div dir="rtl"><p>שלום ${toName ?? ''},</p><p>מצורף דוח תשומות לתקופה ${periodLabel}.</p><p>הדוח נוצר אוטומטית על ידי מערכת ניהול הכספים.</p></div>`,
    attachments,
  });

  if (error) return res.status(500).json({ error: 'Failed to send email' });

  return res.status(200).json({ ok: true });
}
