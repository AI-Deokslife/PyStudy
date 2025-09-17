import { Hono } from 'hono';
import { CloudflareBindings, CreateUserRequest } from '../types';
import { hashPassword } from '../utils/auth';

const admin = new Hono<{ Bindings: CloudflareBindings }>();

// 사용자 생성
admin.post('/users', async (c) => {
  try {
    const userData: CreateUserRequest = await c.req.json();
    
    const { username, password, full_name, email, role, class_id } = userData;

    if (!username || !password || !full_name || !role) {
      return c.json({ error: '필수 필드가 누락되었습니다.' }, 400);
    }

    // 중복 사용자명 확인
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();

    if (existingUser) {
      return c.json({ error: '이미 존재하는 사용자명입니다.' }, 400);
    }

    // 비밀번호 해시 (개발용 단순 저장)
    const password_hash = await hashPassword(password);

    // 사용자 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, password_hash, full_name, email, role, class_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(username, password_hash, full_name, email || null, role, class_id || null).run();

    return c.json({ 
      id: result.meta.last_row_id,
      username,
      full_name,
      role,
      class_id 
    });

  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: '사용자 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 엑셀 파일로 대량 사용자 생성
admin.post('/users/bulk', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: '파일을 선택해주세요.' }, 400);
    }

    // 파일 내용 읽기 (CSV 형태로 가정)
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return c.json({ error: '빈 파일입니다.' }, 400);
    }

    const users = [];
    const errors = [];

    // 첫 번째 줄은 헤더로 가정
    const headers = lines[0].split(',').map(h => h.trim());
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        errors.push(`줄 ${i + 1}: 컬럼 수가 맞지 않습니다.`);
        continue;
      }

      const userData: any = {};
      headers.forEach((header, index) => {
        userData[header] = values[index];
      });

      try {
        // 필수 필드 확인
        if (!userData.username || !userData.password || !userData.full_name || !userData.role) {
          errors.push(`줄 ${i + 1}: 필수 필드가 누락되었습니다.`);
          continue;
        }

        // 중복 확인
        const existingUser = await c.env.DB.prepare(
          'SELECT id FROM users WHERE username = ?'
        ).bind(userData.username).first();

        if (existingUser) {
          errors.push(`줄 ${i + 1}: 사용자명 '${userData.username}'이 이미 존재합니다.`);
          continue;
        }

        const password_hash = await hashPassword(userData.password);

        const result = await c.env.DB.prepare(`
          INSERT INTO users (username, password_hash, full_name, email, role, class_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          userData.username,
          password_hash,
          userData.full_name,
          userData.email || null,
          userData.role,
          userData.class_id || null
        ).run();

        users.push({
          id: result.meta.last_row_id,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role,
          class_id: userData.class_id
        });

      } catch (error) {
        errors.push(`줄 ${i + 1}: ${error}`);
      }
    }

    return c.json({
      success: users.length,
      errors: errors.length,
      users,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Bulk create users error:', error);
    return c.json({ error: '사용자 대량 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 모든 사용자 조회
admin.get('/users', async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, username, full_name, email, role, class_id, created_at
      FROM users 
      ORDER BY created_at DESC
    `).all();

    return c.json({ users: users.results });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: '사용자 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 사용자 삭제
admin.delete('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(id).run();

    if (result.changes === 0) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    return c.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: '사용자 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default admin;