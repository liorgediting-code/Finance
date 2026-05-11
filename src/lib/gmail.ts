const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

export interface GmailMessage {
  id: string;
  threadId: string;
}

export interface GmailMessageDetail {
  id: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string; size: number };
    parts?: GmailPart[];
    mimeType: string;
  };
  internalDate: string;
}

export interface GmailPart {
  partId: string;
  mimeType: string;
  filename: string;
  body: { attachmentId?: string; data?: string; size: number };
  parts?: GmailPart[];
}

export interface GmailAttachment {
  data: string; // base64url encoded
  size: number;
}

async function gmailFetch(path: string, accessToken: string): Promise<Response> {
  return fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function listPurchaseMessages(
  accessToken: string,
  maxResults = 50
): Promise<GmailMessage[]> {
  const since = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
  const query = encodeURIComponent(`category:purchases after:${since}`);
  const res = await gmailFetch(`/messages?q=${query}&maxResults=${maxResults}`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  const json = await res.json();
  return (json.messages as GmailMessage[]) ?? [];
}

export async function getMessageDetail(
  messageId: string,
  accessToken: string
): Promise<GmailMessageDetail> {
  const res = await gmailFetch(`/messages/${messageId}?format=full`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

export async function getAttachment(
  messageId: string,
  attachmentId: string,
  accessToken: string
): Promise<GmailAttachment> {
  const res = await gmailFetch(`/messages/${messageId}/attachments/${attachmentId}`, accessToken);
  if (!res.ok) throw new Error(`Gmail API ${res.status}`);
  return res.json();
}

export function getHeader(detail: GmailMessageDetail, name: string): string {
  return detail.payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

export function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64);
}

export function extractHtmlBody(payload: GmailMessageDetail['payload']): string {
  if (payload.mimeType === 'text/html' && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.parts) {
        for (const sub of part.parts) {
          if (sub.mimeType === 'text/html' && sub.body.data) {
            return decodeBase64Url(sub.body.data);
          }
        }
      }
    }
  }
  if (payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  return '';
}

export function findPdfAttachments(payload: GmailMessageDetail['payload']): GmailPart[] {
  const results: GmailPart[] = [];
  const scan = (parts: GmailPart[]) => {
    for (const part of parts) {
      if (part.mimeType === 'application/pdf' || part.filename?.endsWith('.pdf')) {
        results.push(part);
      }
      if (part.parts) scan(part.parts);
    }
  };
  if (payload.parts) scan(payload.parts);
  return results;
}
