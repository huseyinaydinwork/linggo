// Sunucu API istemcisi
export class ApiError extends Error { constructor(status, message, data) { super(message); this.status = status; this.data = data; } }

export async function api(path, { method = 'GET', body, keepalive = false } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method, keepalive, credentials: 'same-origin',
      headers: { 'X-Pratilange': '1', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Bağlantı kurulamadı. İnternetini kontrol et.');
  }
  let data = null;
  try { data = await res.json(); } catch { }
  if (!res.ok) throw new ApiError(res.status, data?.error || 'Bir şeyler ters gitti.', data);
  return data;
}

export const post = (p, body) => api(p, { method: 'POST', body: body ?? {} });
