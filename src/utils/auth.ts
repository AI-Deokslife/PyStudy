import { JWTPayload } from '../types';

// 간단한 JWT 구현 (실제 환경에서는 더 안전한 구현 필요)
const JWT_SECRET = 'your-secret-key-change-in-production';

// UTF-8 안전한 Base64 인코딩 함수
function utf8ToBase64(str: string): string {
  // UTF-8 문자열을 Uint8Array로 변환
  const encoder = new TextEncoder();
  const uint8Array = encoder.encode(str);
  
  // Uint8Array를 Base64로 변환
  let binary = '';
  uint8Array.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

// UTF-8 안전한 Base64 디코딩 함수
function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const uint8Array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(uint8Array);
}

export function createToken(payload: JWTPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60) // 24시간 만료
  };

  const encodedHeader = utf8ToBase64(JSON.stringify(header));
  const encodedPayload = utf8ToBase64(JSON.stringify(tokenPayload));
  
  // 간단한 서명 생성 (실제로는 HMAC-SHA256 사용 권장)
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // 서명 검증
    const expectedSignature = btoa(`${encodedHeader}.${encodedPayload}.${JWT_SECRET}`);
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64ToUtf8(encodedPayload));
    
    // 만료 시간 확인
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  // Cloudflare Workers에서는 bcrypt를 직접 사용할 수 없으므로
  // 간단한 해시 구현 (실제로는 Web Crypto API 사용 권장)
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}