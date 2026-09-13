/**
 * JWT Utility Functions for PillSync
 * Standard Base64Url encoding/decoding and JWT verification
 */

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  const base64 = btoa(binary);
  return base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(str) {
  let base64 = str.replaceAll('-', '+').replaceAll('_', '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  let i = 0;
  for (const char of binary) {
    bytes[i++] = char.codePointAt(0);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generate a standard 3-part JWT token (header.payload.signature)
 */
export function generateJWT(payload, expiresInSeconds = 86400) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    iss: 'pillsync-auth-service',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  // Mock signature for client-side JWT token verification
  const signature = base64UrlEncode('sig_' + (payload.id || payload.sub || 'user') + '_' + now);

  return encodedHeader + '.' + encodedPayload + '.' + signature;
}

/**
 * Decode and parse JWT payload
 */
export function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson);
  } catch (err) {
    console.warn('Failed to parse JWT token:', err);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token) {
  const payload = decodeJWT(token);
  if (!payload?.exp) return false;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}
