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

// 사용자 수정
admin.put('/users/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const userData: CreateUserRequest = await c.req.json();
    
    const { username, password, full_name, email, role, class_id } = userData;

    if (!username || !full_name || !role) {
      return c.json({ error: '필수 필드가 누락되었습니다.' }, 400);
    }

    // 현재 사용자 정보 확인
    const currentUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first();

    if (!currentUser) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 다른 사용자와 사용자명 중복 확인
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ? AND id != ?'
    ).bind(username, id).first();

    if (existingUser) {
      return c.json({ error: '이미 존재하는 사용자명입니다.' }, 400);
    }

    let updateQuery;
    let bindValues;

    // 비밀번호가 제공되면 해시하여 업데이트, 아니면 기존 비밀번호 유지
    if (password && password.trim() !== '') {
      const password_hash = await hashPassword(password);
      updateQuery = `
        UPDATE users 
        SET username = ?, password_hash = ?, full_name = ?, email = ?, role = ?, class_id = ?
        WHERE id = ?
      `;
      bindValues = [username, password_hash, full_name, email || null, role, class_id || null, id];
    } else {
      updateQuery = `
        UPDATE users 
        SET username = ?, full_name = ?, email = ?, role = ?, class_id = ?
        WHERE id = ?
      `;
      bindValues = [username, full_name, email || null, role, class_id || null, id];
    }

    const result = await c.env.DB.prepare(updateQuery).bind(...bindValues).run();

    if (result.changes === 0) {
      return c.json({ error: '사용자 수정에 실패했습니다.' }, 500);
    }

    // 수정된 사용자 정보 반환
    const updatedUser = await c.env.DB.prepare(
      'SELECT id, username, full_name, email, role, class_id FROM users WHERE id = ?'
    ).bind(id).first();

    return c.json({
      message: '사용자가 성공적으로 수정되었습니다.',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: '사용자 수정 중 오류가 발생했습니다.' }, 500);
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

// 관리자 비밀번호 변경
admin.put('/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    
    if (!currentPassword || !newPassword) {
      return c.json({ error: '현재 비밀번호와 새 비밀번호가 필요합니다.' }, 400);
    }

    // 비밀번호 강도 검증
    if (newPassword.length < 6) {
      return c.json({ error: '새 비밀번호는 최소 6자리 이상이어야 합니다.' }, 400);
    }

    // Authorization 헤더에서 토큰 추출
    const authHeader = c.req.header('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }

    // JWT에서 사용자 ID 추출 (여기서는 간단히 구현)
    const token = authHeader.substring(7);
    
    // 현재 사용자 정보 조회 (JWT 디코딩 대신 admin 계정으로 가정)
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE username = ? AND role = ?'
    ).bind('admin', 'admin').first();

    if (!user) {
      return c.json({ error: '관리자 계정을 찾을 수 없습니다.' }, 404);
    }

    // 현재 비밀번호 확인 (하이브리드 방식)
    let isValidCurrentPassword = false;
    if (user.username === 'admin' && currentPassword === 'admin123') {
      // 기본 관리자 계정의 경우
      isValidCurrentPassword = true;
    } else {
      // 해시된 비밀번호 확인
      const { verifyPassword } = await import('../utils/auth');
      isValidCurrentPassword = await verifyPassword(currentPassword, user.password_hash);
    }

    if (!isValidCurrentPassword) {
      return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 400);
    }

    // 새 비밀번호 해시
    const newPasswordHash = await hashPassword(newPassword);

    // 비밀번호 업데이트
    const result = await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE username = ? AND role = ?'
    ).bind(newPasswordHash, 'admin', 'admin').run();

    if (result.changes === 0) {
      return c.json({ error: '비밀번호 변경에 실패했습니다.' }, 500);
    }

    return c.json({ 
      message: '비밀번호가 성공적으로 변경되었습니다.',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 목록 조회
admin.get('/classes', async (c) => {
  try {
    const classes = await c.env.DB.prepare(`
      SELECT c.*, u.full_name as teacher_name,
             COUNT(DISTINCT students.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id AND u.role = 'teacher'  
      LEFT JOIN users students ON c.id = students.class_id AND students.role = 'student'
      GROUP BY c.id
      ORDER BY c.id
    `).all();

    return c.json({ classes: classes.results });
  } catch (error) {
    console.error('Get classes error:', error);
    return c.json({ error: '클래스 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 생성
admin.post('/classes', async (c) => {
  try {
    const { id, name, description, teacher_id } = await c.req.json();

    if (!id || !name) {
      return c.json({ error: '클래스 ID와 이름은 필수입니다.' }, 400);
    }

    // 중복 클래스 ID 확인
    const existingClass = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ?'
    ).bind(id).first();

    if (existingClass) {
      return c.json({ error: '이미 존재하는 클래스 ID입니다.' }, 400);
    }

    // 교사 ID 유효성 검사
    if (teacher_id) {
      const teacher = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ? AND role = ?'
      ).bind(teacher_id, 'teacher').first();

      if (!teacher) {
        return c.json({ error: '유효하지 않은 교사 ID입니다.' }, 400);
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO classes (id, name, description, teacher_id)
      VALUES (?, ?, ?, ?)
    `).bind(id, name, description || null, teacher_id || null).run();

    return c.json({ 
      id,
      name,
      description,
      teacher_id
    });

  } catch (error) {
    console.error('Create class error:', error);
    return c.json({ error: '클래스 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 수정
admin.put('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const { name, description, teacher_id } = await c.req.json();

    if (!name) {
      return c.json({ error: '클래스 이름은 필수입니다.' }, 400);
    }

    // 클래스 존재 확인
    const existingClass = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ?'
    ).bind(classId).first();

    if (!existingClass) {
      return c.json({ error: '존재하지 않는 클래스입니다.' }, 404);
    }

    // 교사 ID 유효성 검사
    if (teacher_id) {
      const teacher = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ? AND role = ?'
      ).bind(teacher_id, 'teacher').first();

      if (!teacher) {
        return c.json({ error: '유효하지 않은 교사 ID입니다.' }, 400);
      }
    }

    await c.env.DB.prepare(`
      UPDATE classes SET name = ?, description = ?, teacher_id = ?
      WHERE id = ?
    `).bind(name, description || null, teacher_id || null, classId).run();

    return c.json({ message: '클래스가 성공적으로 수정되었습니다.' });

  } catch (error) {
    console.error('Update class error:', error);
    return c.json({ error: '클래스 수정 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 삭제
admin.delete('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');

    // 클래스에 속한 학생이 있는지 확인
    const students = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE class_id = ? AND role = ?'
    ).bind(classId, 'student').first();

    if (students && students.count > 0) {
      return c.json({ error: '클래스에 속한 학생이 있어 삭제할 수 없습니다.' }, 400);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM classes WHERE id = ?'
    ).bind(classId).run();

    if (result.changes === 0) {
      return c.json({ error: '존재하지 않는 클래스입니다.' }, 404);
    }

    return c.json({ message: '클래스가 성공적으로 삭제되었습니다.' });

  } catch (error) {
    console.error('Delete class error:', error);
    return c.json({ error: '클래스 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

export default admin;