import { Hono } from 'hono';
import { CloudflareBindings, LoginRequest, JWTPayload } from '../types';
import { createToken, verifyPassword } from '../utils/auth';

const auth = new Hono<{ Bindings: CloudflareBindings }>();

// 로그인
auth.post('/login', async (c) => {
  try {
    const { username, password }: LoginRequest = await c.req.json();

    if (!username || !password) {
      return c.json({ error: '사용자명과 비밀번호를 입력해주세요.' }, 400);
    }

    // 사용자 조회
    const user = await c.env.DB.prepare(
      'SELECT id, username, password_hash, full_name, role, class_id FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 401);
    }

    // 비밀번호 확인 (개발용 단순 비교)
    if (password !== 'admin123' && password !== 'teacher123' && password !== 'student123') {
      return c.json({ error: '비밀번호가 잘못되었습니다.' }, 401);
    }

    // JWT 토큰 생성
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as 'admin' | 'teacher' | 'student',
      classId: user.class_id || undefined
    };

    const token = createToken(payload);

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        class_id: user.class_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: '로그인 중 오류가 발생했습니다.' }, 500);
  }
});

// 현재 사용자 정보 조회
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '인증 토큰이 필요합니다.' }, 401);
  }

  // 간단한 토큰 파싱 (실제 환경에서는 미들웨어 사용)
  try {
    const token = authHeader.substring(7);
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    const user = await c.env.DB.prepare(
      'SELECT id, username, full_name, role, class_id FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ user });
  } catch (error) {
    return c.json({ error: '유효하지 않은 토큰입니다.' }, 401);
  }
});

export default auth;