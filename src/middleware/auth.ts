import { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth';
import { CloudflareBindings, JWTPayload } from '../types';

export async function authMiddleware(c: Context<{ Bindings: CloudflareBindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return c.json({ error: '유효하지 않거나 만료된 토큰입니다.' }, 401);
  }

  // 사용자 정보를 컨텍스트에 추가
  c.set('user', payload);
  await next();
}

export function requireRole(roles: string[]) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: Next) => {
    const user = c.get('user') as JWTPayload;
    
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: '권한이 없습니다.' }, 403);
    }

    await next();
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireTeacher = requireRole(['teacher', 'admin']);
export const requireStudent = requireRole(['student', 'teacher', 'admin']);