import { Hono } from 'hono';
import { CloudflareBindings, CreateProblemRequest, CreateSessionRequest } from '../types';

const teacher = new Hono<{ Bindings: CloudflareBindings }>();

// 문제 생성
teacher.post('/problems', async (c) => {
  try {
    const problemData: CreateProblemRequest = await c.req.json();
    
    // 사용자 정보 가져오기 (간단한 토큰 파싱)
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    const { title, description, initial_code, expected_output, test_cases, time_limit, memory_limit, difficulty } = problemData;

    if (!title || !description) {
      return c.json({ error: '제목과 설명은 필수입니다.' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO problems (title, description, initial_code, expected_output, test_cases, time_limit, memory_limit, difficulty, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      description,
      initial_code || '',
      expected_output || '',
      JSON.stringify(test_cases || []),
      time_limit || 30,
      memory_limit || 128,
      difficulty || 'easy',
      payload.userId
    ).run();

    return c.json({ 
      id: result.meta.last_row_id,
      title,
      description,
      difficulty: difficulty || 'easy'
    });

  } catch (error) {
    console.error('Create problem error:', error);
    return c.json({ error: '문제 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 내가 만든 문제 목록 조회
teacher.get('/problems', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const problems = await c.env.DB.prepare(`
      SELECT id, title, description, difficulty, time_limit, created_at
      FROM problems 
      WHERE created_by = ?
      ORDER BY created_at DESC
    `).bind(payload.userId).all();

    return c.json({ problems: problems.results });
  } catch (error) {
    console.error('Get problems error:', error);
    return c.json({ error: '문제 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 교사의 클래스 목록 조회
teacher.get('/classes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    console.log('Teacher classes request - userId:', payload.userId);

    const classes = await c.env.DB.prepare(`
      SELECT c.id, c.name, c.description, c.created_at,
             COUNT(cm.student_id) as student_count
      FROM classes c
      LEFT JOIN class_members cm ON c.id = cm.class_id
      WHERE c.teacher_id = ?
      GROUP BY c.id, c.name, c.description, c.created_at
      ORDER BY c.created_at DESC
    `).bind(payload.userId).all();

    console.log('Found classes for teacher:', classes.results.length);

    return c.json({ classes: classes.results });
  } catch (error) {
    console.error('Get classes error:', error);
    return c.json({ error: '클래스 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 생성
teacher.post('/classes', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { id, name, description } = await c.req.json();

    if (!id || !name) {
      return c.json({ error: '클래스 ID와 이름은 필수입니다.' }, 400);
    }

    // 클래스 ID 중복 확인
    const existing = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ?'
    ).bind(id).first();

    if (existing) {
      return c.json({ error: '이미 존재하는 클래스 ID입니다.' }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO classes (id, name, description, teacher_id)
      VALUES (?, ?, ?, ?)
    `).bind(id, name, description || '', payload.userId).run();

    return c.json({ 
      message: '클래스가 생성되었습니다.',
      class: { id, name, description, student_count: 0 }
    });

  } catch (error) {
    console.error('Create class error:', error);
    return c.json({ error: '클래스 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 수정
teacher.put('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { name, description } = await c.req.json();

    if (!name) {
      return c.json({ error: '클래스 이름은 필수입니다.' }, 400);
    }

    // 클래스 소유자 확인
    const existing = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!existing) {
      return c.json({ error: '클래스를 찾을 수 없거나 수정 권한이 없습니다.' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE classes 
      SET name = ?, description = ?
      WHERE id = ? AND teacher_id = ?
    `).bind(name, description || '', classId, payload.userId).run();

    return c.json({ message: '클래스가 수정되었습니다.' });

  } catch (error) {
    console.error('Update class error:', error);
    return c.json({ error: '클래스 수정 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 삭제
teacher.delete('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 클래스 소유자 확인
    const existing = await c.env.DB.prepare(
      'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!existing) {
      return c.json({ error: '클래스를 찾을 수 없거나 삭제 권한이 없습니다.' }, 404);
    }

    // 활성 세션이 있는지 확인
    const activeSessions = await c.env.DB.prepare(
      'SELECT id FROM problem_sessions WHERE class_id = ? AND status = ?'
    ).bind(classId, 'active').first();

    if (activeSessions) {
      return c.json({ error: '현재 활성 세션이 있는 클래스는 삭제할 수 없습니다.' }, 400);
    }

    // 클래스 삭제 (CASCADE로 class_members도 자동 삭제됨)
    await c.env.DB.prepare(
      'DELETE FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).run();

    return c.json({ message: `클래스 "${existing.name}"가 삭제되었습니다.` });

  } catch (error) {
    console.error('Delete class error:', error);
    return c.json({ error: '클래스 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

// 개별 클래스 조회
teacher.get('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 클래스 소유자 확인 및 정보 조회
    const classInfo = await c.env.DB.prepare(
      'SELECT id, name, description, created_at FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!classInfo) {
      return c.json({ error: '클래스를 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
    }

    return c.json({ class: classInfo });

  } catch (error) {
    console.error('Get class info error:', error);
    return c.json({ error: '클래스 정보 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스 멤버 조회
teacher.get('/classes/:id/members', async (c) => {
  try {
    const classId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 클래스 소유자 확인
    const classInfo = await c.env.DB.prepare(
      'SELECT id, name FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!classInfo) {
      return c.json({ error: '클래스를 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
    }

    const members = await c.env.DB.prepare(`
      SELECT u.id, u.username, u.full_name, cm.joined_at
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      WHERE cm.class_id = ?
      ORDER BY cm.joined_at DESC
    `).bind(classId).all();

    return c.json({ 
      class: classInfo,
      members: members.results 
    });

  } catch (error) {
    console.error('Get class members error:', error);
    return c.json({ error: '클래스 멤버 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스에 학생 추가
teacher.post('/classes/:id/members', async (c) => {
  try {
    const classId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { studentIds } = await c.req.json();

    if (!studentIds || !Array.isArray(studentIds)) {
      return c.json({ error: '학생 ID 목록이 필요합니다.' }, 400);
    }

    // 클래스 소유자 확인
    const classInfo = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!classInfo) {
      return c.json({ error: '클래스를 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
    }

    let addedCount = 0;
    for (const studentId of studentIds) {
      try {
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO class_members (class_id, student_id)
          VALUES (?, ?)
        `).bind(classId, studentId).run();
        addedCount++;
      } catch (error) {
        console.error('Failed to add student:', studentId, error);
      }
    }

    return c.json({ 
      message: `${addedCount}명의 학생이 클래스에 추가되었습니다.`,
      addedCount
    });

  } catch (error) {
    console.error('Add class members error:', error);
    return c.json({ error: '클래스 멤버 추가 중 오류가 발생했습니다.' }, 500);
  }
});

// 클래스에서 학생 제거
teacher.delete('/classes/:id/members/:studentId', async (c) => {
  try {
    const classId = c.req.param('id');
    const studentId = c.req.param('studentId');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 클래스 소유자 확인
    const classInfo = await c.env.DB.prepare(
      'SELECT id FROM classes WHERE id = ? AND teacher_id = ?'
    ).bind(classId, payload.userId).first();

    if (!classInfo) {
      return c.json({ error: '클래스를 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM class_members WHERE class_id = ? AND student_id = ?'
    ).bind(classId, studentId).run();

    if (result.changes === 0) {
      return c.json({ error: '해당 학생이 클래스에 속해있지 않습니다.' }, 404);
    }

    return c.json({ message: '학생이 클래스에서 제거되었습니다.' });

  } catch (error) {
    console.error('Remove class member error:', error);
    return c.json({ error: '클래스 멤버 제거 중 오류가 발생했습니다.' }, 500);
  }
});

// 전체 학생 목록 조회 (클래스 멤버 관리용)
teacher.get('/students', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const students = await c.env.DB.prepare(`
      SELECT id, username, full_name, email, created_at
      FROM users
      WHERE role = 'student'
      ORDER BY full_name, username
    `).all();

    return c.json({ students: students.results });

  } catch (error) {
    console.error('Get students error:', error);
    return c.json({ error: '학생 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 개별 문제 조회 (편집용)
teacher.get('/problems/:id', async (c) => {
  try {
    const problemId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const problem = await c.env.DB.prepare(`
      SELECT id, title, description, initial_code, expected_output, test_cases, 
             time_limit, memory_limit, difficulty, created_at
      FROM problems 
      WHERE id = ? AND created_by = ?
    `).bind(problemId, payload.userId).first();

    if (!problem) {
      return c.json({ error: '문제를 찾을 수 없거나 권한이 없습니다.' }, 404);
    }

    // test_cases JSON 파싱
    let parsedTestCases = [];
    try {
      parsedTestCases = JSON.parse(problem.test_cases || '[]');
    } catch (e) {
      parsedTestCases = [];
    }

    return c.json({ 
      problem: {
        ...problem,
        test_cases: parsedTestCases
      }
    });
  } catch (error) {
    console.error('Get problem error:', error);
    return c.json({ error: '문제 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 문제 수정
teacher.put('/problems/:id', async (c) => {
  try {
    const problemId = c.req.param('id');
    const problemData: CreateProblemRequest = await c.req.json();
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    const { title, description, initial_code, expected_output, test_cases, time_limit, memory_limit, difficulty } = problemData;

    if (!title || !description) {
      return c.json({ error: '제목과 설명은 필수입니다.' }, 400);
    }

    // 문제 존재 및 권한 확인
    const existingProblem = await c.env.DB.prepare(`
      SELECT id FROM problems WHERE id = ? AND created_by = ?
    `).bind(problemId, payload.userId).first();

    if (!existingProblem) {
      return c.json({ error: '문제를 찾을 수 없거나 수정 권한이 없습니다.' }, 404);
    }

    const result = await c.env.DB.prepare(`
      UPDATE problems 
      SET title = ?, description = ?, initial_code = ?, expected_output = ?, 
          test_cases = ?, time_limit = ?, memory_limit = ?, difficulty = ?
      WHERE id = ? AND created_by = ?
    `).bind(
      title,
      description,
      initial_code || '',
      expected_output || '',
      JSON.stringify(test_cases || []),
      time_limit || 30,
      memory_limit || 128,
      difficulty || 'easy',
      problemId,
      payload.userId
    ).run();

    if (result.changes === 0) {
      return c.json({ error: '문제 수정에 실패했습니다.' }, 500);
    }

    return c.json({ 
      message: '문제가 성공적으로 수정되었습니다.',
      problem: {
        id: problemId,
        title,
        description,
        difficulty: difficulty || 'easy'
      }
    });

  } catch (error) {
    console.error('Update problem error:', error);
    return c.json({ error: '문제 수정 중 오류가 발생했습니다.' }, 500);
  }
});

// 문제 삭제
teacher.delete('/problems/:id', async (c) => {
  try {
    const problemId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 문제 존재 및 권한 확인
    const existingProblem = await c.env.DB.prepare(`
      SELECT id, title FROM problems WHERE id = ? AND created_by = ?
    `).bind(problemId, payload.userId).first();

    if (!existingProblem) {
      return c.json({ error: '문제를 찾을 수 없거나 삭제 권한이 없습니다.' }, 404);
    }

    // 활성 세션에서 사용 중인지 확인
    const activeSessions = await c.env.DB.prepare(`
      SELECT id FROM problem_sessions 
      WHERE problem_id = ? AND status = 'active'
    `).bind(problemId).first();

    if (activeSessions) {
      return c.json({ 
        error: '현재 활성 세션에서 사용 중인 문제는 삭제할 수 없습니다. 먼저 관련 세션을 종료해주세요.' 
      }, 400);
    }

    // 관련 데이터 삭제 (foreign key constraints 고려)
    // 1. 해당 문제를 사용한 세션들의 제출 기록 삭제
    await c.env.DB.prepare(`
      DELETE FROM submissions 
      WHERE session_id IN (
        SELECT id FROM problem_sessions WHERE problem_id = ?
      )
    `).bind(problemId).run();

    // 2. 해당 문제를 사용한 세션 삭제
    await c.env.DB.prepare(`
      DELETE FROM problem_sessions WHERE problem_id = ?
    `).bind(problemId).run();

    // 3. 문제 삭제
    const result = await c.env.DB.prepare(`
      DELETE FROM problems WHERE id = ? AND created_by = ?
    `).bind(problemId, payload.userId).run();

    if (result.changes === 0) {
      return c.json({ error: '문제 삭제에 실패했습니다.' }, 500);
    }

    return c.json({ 
      message: `문제 "${existingProblem.title}"가 성공적으로 삭제되었습니다.` 
    });

  } catch (error) {
    console.error('Delete problem error:', error);
    return c.json({ error: '문제 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

// 문제 세션 생성 (실시간 문제 출제)
teacher.post('/sessions', async (c) => {
  try {
    const sessionData: CreateSessionRequest = await c.req.json();
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    const { problem_id, class_id, title } = sessionData;

    if (!problem_id || !class_id || !title) {
      return c.json({ error: '모든 필드가 필요합니다.' }, 400);
    }

    // 문제 존재 확인
    const problem = await c.env.DB.prepare(
      'SELECT id FROM problems WHERE id = ? AND created_by = ?'
    ).bind(problem_id, payload.userId).first();

    if (!problem) {
      return c.json({ error: '문제를 찾을 수 없거나 권한이 없습니다.' }, 404);
    }

    // 기존 활성 세션 종료
    await c.env.DB.prepare(
      'UPDATE problem_sessions SET status = ?, end_time = ? WHERE class_id = ? AND status = ?'
    ).bind('ended', new Date().toISOString(), class_id, 'active').run();

    // 새 세션 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO problem_sessions (problem_id, class_id, teacher_id, title)
      VALUES (?, ?, ?, ?)
    `).bind(problem_id, class_id, payload.userId, title).run();

    return c.json({ 
      id: result.meta.last_row_id,
      title,
      status: 'active'
    });

  } catch (error) {
    console.error('Create session error:', error);
    return c.json({ error: '세션 생성 중 오류가 발생했습니다.' }, 500);
  }
});

// 활성 세션 조회
teacher.get('/sessions/active', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const sessions = await c.env.DB.prepare(`
      SELECT ps.*, p.title as problem_title, p.description as problem_description,
             u.full_name as teacher_name
      FROM problem_sessions ps
      JOIN problems p ON ps.problem_id = p.id
      JOIN users u ON ps.teacher_id = u.id
      WHERE ps.teacher_id = ? AND ps.status = 'active'
      ORDER BY ps.start_time DESC
    `).bind(payload.userId).all();

    return c.json({ sessions: sessions.results });
  } catch (error) {
    console.error('Get active sessions error:', error);
    return c.json({ error: '활성 세션 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션 종료
teacher.post('/sessions/:id/end', async (c) => {
  try {
    const sessionId = c.req.param('id');
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const result = await c.env.DB.prepare(`
      UPDATE problem_sessions 
      SET status = 'ended', end_time = ? 
      WHERE id = ? AND teacher_id = ?
    `).bind(new Date().toISOString(), sessionId, payload.userId).run();

    if (result.changes === 0) {
      return c.json({ error: '세션을 찾을 수 없거나 권한이 없습니다.' }, 404);
    }

    return c.json({ message: '세션이 종료되었습니다.' });
  } catch (error) {
    console.error('End session error:', error);
    return c.json({ error: '세션 종료 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션의 제출 결과 조회
teacher.get('/sessions/:id/submissions', async (c) => {
  try {
    const sessionId = c.req.param('id');
    
    const submissions = await c.env.DB.prepare(`
      SELECT s.*, u.full_name as student_name, u.username as student_username
      FROM submissions s
      JOIN users u ON s.student_id = u.id
      WHERE s.session_id = ?
      ORDER BY s.submitted_at DESC
    `).bind(sessionId).all();

    return c.json({ submissions: submissions.results });
  } catch (error) {
    console.error('Get submissions error:', error);
    return c.json({ error: '제출 결과 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 선택한 제출들 삭제
teacher.delete('/submissions/delete', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { submissionIds } = await c.req.json();

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return c.json({ error: '삭제할 제출 ID가 필요합니다.' }, 400);
    }

    // 교사가 자신의 세션 제출만 삭제할 수 있도록 검증
    const placeholders = submissionIds.map(() => '?').join(',');
    const submissions = await c.env.DB.prepare(`
      SELECT s.id FROM submissions s
      JOIN problem_sessions ps ON s.session_id = ps.id
      WHERE s.id IN (${placeholders}) AND ps.teacher_id = ?
    `).bind(...submissionIds, payload.userId).all();

    const validSubmissionIds = submissions.results.map((s: any) => s.id);
    
    if (validSubmissionIds.length === 0) {
      return c.json({ error: '삭제할 권한이 없습니다.' }, 403);
    }

    // 제출 삭제
    const deletePlaceholders = validSubmissionIds.map(() => '?').join(',');
    await c.env.DB.prepare(`
      DELETE FROM submissions WHERE id IN (${deletePlaceholders})
    `).bind(...validSubmissionIds).run();

    return c.json({ 
      message: `${validSubmissionIds.length}개의 제출이 삭제되었습니다.`,
      deletedCount: validSubmissionIds.length
    });

  } catch (error) {
    console.error('Delete submissions error:', error);
    return c.json({ error: '제출 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션의 모든 제출 삭제
teacher.delete('/sessions/:sessionId/submissions', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 세션 소유자 확인
    const session = await c.env.DB.prepare(
      'SELECT id FROM problem_sessions WHERE id = ? AND teacher_id = ?'
    ).bind(sessionId, payload.userId).first();

    if (!session) {
      return c.json({ error: '세션을 찾을 수 없거나 권한이 없습니다.' }, 404);
    }

    // 모든 제출 삭제
    const result = await c.env.DB.prepare(
      'DELETE FROM submissions WHERE session_id = ?'
    ).bind(sessionId).run();

    return c.json({ 
      message: `${result.changes}개의 제출이 삭제되었습니다.`,
      deletedCount: result.changes
    });

  } catch (error) {
    console.error('Delete all submissions error:', error);
    return c.json({ error: '제출 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

// 선택한 제출들 다운로드 (CSV 형태)
teacher.post('/submissions/download', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { submissionIds } = await c.req.json();

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return c.json({ error: '다운로드할 제출 ID가 필요합니다.' }, 400);
    }

    // 교사가 자신의 세션 제출만 다운로드할 수 있도록 검증 및 데이터 조회
    const placeholders = submissionIds.map(() => '?').join(',');
    const submissions = await c.env.DB.prepare(`
      SELECT s.*, u.username as student_username, u.full_name as student_name,
             p.title as problem_title, ps.class_id
      FROM submissions s
      JOIN problem_sessions ps ON s.session_id = ps.id
      JOIN users u ON s.student_id = u.id
      JOIN problems p ON ps.problem_id = p.id
      WHERE s.id IN (${placeholders}) AND ps.teacher_id = ?
      ORDER BY s.submitted_at DESC
    `).bind(...submissionIds, payload.userId).all();

    if (submissions.results.length === 0) {
      return c.json({ error: '다운로드할 제출이 없습니다.' }, 404);
    }

    // JSON 형태로 데이터 반환 (엑셀 생성을 위해)
    return c.json({
      submissions: submissions.results.map((sub: any) => ({
        id: sub.id,
        student_name: sub.student_name || '',
        student_username: sub.student_username || '',
        problem_title: sub.problem_title || '',
        class_id: sub.class_id || '',
        submitted_at: sub.submitted_at,
        status: sub.status || '',
        execution_time: sub.execution_time || '',
        code: sub.code || '',
        output: sub.output || '',
        error_message: sub.error_message || ''
      }))
    });

  } catch (error) {
    console.error('Download submissions error:', error);
    return c.json({ error: '제출 다운로드 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션의 모든 제출 다운로드 (CSV 형태)
teacher.get('/sessions/:sessionId/submissions/download', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 세션 소유자 확인 및 제출 데이터 조회
    const submissions = await c.env.DB.prepare(`
      SELECT s.*, u.username as student_username, u.full_name as student_name,
             p.title as problem_title, ps.class_id, ps.title as session_title
      FROM submissions s
      JOIN problem_sessions ps ON s.session_id = ps.id
      JOIN users u ON s.student_id = u.id
      JOIN problems p ON ps.problem_id = p.id
      WHERE ps.id = ? AND ps.teacher_id = ?
      ORDER BY s.submitted_at DESC
    `).bind(sessionId, payload.userId).all();

    if (submissions.results.length === 0) {
      return c.json({ error: '다운로드할 제출이 없습니다.' }, 404);
    }

    // JSON 형태로 데이터 반환 (엑셀 생성을 위해)
    return c.json({
      submissions: submissions.results.map((sub: any) => ({
        id: sub.id,
        student_name: sub.student_name || '',
        student_username: sub.student_username || '',
        problem_title: sub.problem_title || '',
        session_title: sub.session_title || '',
        class_id: sub.class_id || '',
        submitted_at: sub.submitted_at,
        status: sub.status || '',
        execution_time: sub.execution_time || '',
        code: sub.code || '',
        output: sub.output || '',
        error_message: sub.error_message || ''
      }))
    });

  } catch (error) {
    console.error('Download all submissions error:', error);
    return c.json({ error: '제출 다운로드 중 오류가 발생했습니다.' }, 500);
  }
});

// 삭제 요청 목록 조회 (교사용)
teacher.get('/deletion-requests', async (c) => {
  try {
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    // 교사 권한 확인
    const teacher = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ? AND role = ?'
    ).bind(payload.userId, 'teacher').first();
    
    if (!teacher) {
      return c.json({ error: '교사 권한이 필요합니다.' }, 403);
    }
    
    // 모든 삭제 요청 조회
    const requests = await c.env.DB.prepare(`
      SELECT 
        dr.*,
        s.code,
        s.output,
        s.submitted_at,
        ps.title as session_title,
        p.title as problem_title,
        t.full_name as teacher_name
      FROM submission_deletion_requests dr
      JOIN submissions s ON dr.submission_id = s.id
      JOIN problem_sessions ps ON s.session_id = ps.id
      JOIN problems p ON ps.problem_id = p.id
      LEFT JOIN users t ON dr.teacher_id = t.id
      ORDER BY 
        CASE dr.status 
          WHEN 'pending' THEN 0 
          WHEN 'approved' THEN 1 
          WHEN 'rejected' THEN 2 
        END,
        dr.request_date DESC
    `).all();
    
    return c.json({ requests: requests.results });
    
  } catch (error) {
    console.error('Get deletion requests error:', error);
    return c.json({ error: '삭제 요청 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 삭제 요청 승인/거부
teacher.put('/deletion-requests/:requestId/response', async (c) => {
  try {
    const requestId = parseInt(c.req.param('requestId'));
    const { action, response } = await c.req.json(); // action: 'approve' or 'reject'
    
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    // 교사 권한 확인
    const teacher = await c.env.DB.prepare(
      'SELECT id, full_name FROM users WHERE id = ? AND role = ?'
    ).bind(payload.userId, 'teacher').first();
    
    if (!teacher) {
      return c.json({ error: '교사 권한이 필요합니다.' }, 403);
    }
    
    // 삭제 요청 조회
    const deletionRequest = await c.env.DB.prepare(
      'SELECT * FROM submission_deletion_requests WHERE id = ? AND status = ?'
    ).bind(requestId, 'pending').first();
    
    if (!deletionRequest) {
      return c.json({ error: '처리할 수 있는 삭제 요청을 찾을 수 없습니다.' }, 404);
    }
    
    if (action === 'approve') {
      // 승인: 제출 기록 삭제 및 요청 상태 업데이트
      await c.env.DB.batch([
        c.env.DB.prepare(
          'DELETE FROM submissions WHERE id = ?'
        ).bind(deletionRequest.submission_id),
        c.env.DB.prepare(`
          UPDATE submission_deletion_requests 
          SET status = ?, teacher_id = ?, teacher_response = ?, response_date = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind('approved', payload.userId, response || '승인됨', requestId)
      ]);
      
      return c.json({ 
        message: '삭제 요청이 승인되어 제출 기록이 삭제되었습니다.',
        action: 'approved'
      });
      
    } else if (action === 'reject') {
      // 거부: 요청 상태만 업데이트
      await c.env.DB.prepare(`
        UPDATE submission_deletion_requests 
        SET status = ?, teacher_id = ?, teacher_response = ?, response_date = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind('rejected', payload.userId, response || '거부됨', requestId).run();
      
      return c.json({ 
        message: '삭제 요청이 거부되었습니다.',
        action: 'rejected'
      });
      
    } else {
      return c.json({ error: '올바르지 않은 액션입니다.' }, 400);
    }
    
  } catch (error) {
    console.error('Respond to deletion request error:', error);
    return c.json({ error: '삭제 요청 처리 중 오류가 발생했습니다.' }, 500);
  }
});

// 교사의 직접 제출 기록 삭제
teacher.delete('/submissions/:submissionId', async (c) => {
  try {
    const submissionId = parseInt(c.req.param('submissionId'));
    
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    // 교사 권한 확인
    const teacher = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ? AND role = ?'
    ).bind(payload.userId, 'teacher').first();
    
    if (!teacher) {
      return c.json({ error: '교사 권한이 필요합니다.' }, 403);
    }
    
    // 제출 기록 존재 확인
    const submission = await c.env.DB.prepare(
      'SELECT id FROM submissions WHERE id = ?'
    ).bind(submissionId).first();
    
    if (!submission) {
      return c.json({ error: '제출 기록을 찾을 수 없습니다.' }, 404);
    }
    
    // 제출 기록 삭제 (관련된 삭제 요청도 함께 삭제됨 - CASCADE)
    const result = await c.env.DB.prepare(
      'DELETE FROM submissions WHERE id = ?'
    ).bind(submissionId).run();
    
    if (result.changes === 0) {
      return c.json({ error: '제출 기록 삭제에 실패했습니다.' }, 500);
    }
    
    return c.json({ message: '제출 기록이 삭제되었습니다.' });
    
  } catch (error) {
    console.error('Direct delete submission error:', error);
    return c.json({ error: '제출 기록 삭제 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션 기록 조회
teacher.get('/sessions/history', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 교사의 모든 세션 (진행중 + 완료) 조회
    const sessions = await c.env.DB.prepare(`
      SELECT 
        ps.*,
        p.title as problem_title,
        p.difficulty,
        COUNT(DISTINCT s.student_id) as submission_count,
        COUNT(s.id) as total_submissions,
        ROUND(
          AVG(CASE WHEN s.status = 'success' THEN 1.0 ELSE 0.0 END) * 100, 1
        ) as success_rate
      FROM problem_sessions ps
      LEFT JOIN problems p ON ps.problem_id = p.id
      LEFT JOIN submissions s ON ps.id = s.session_id
      WHERE ps.teacher_id = ?
      GROUP BY ps.id
      ORDER BY ps.start_time DESC
    `).bind(payload.userId).all();

    return c.json({
      sessions: sessions.results.map((session: any) => ({
        id: session.id,
        problem_title: session.problem_title,
        class_id: session.class_id,
        status: session.status,
        start_time: session.start_time,
        end_time: session.end_time,
        submission_count: session.submission_count || 0,
        total_submissions: session.total_submissions || 0,
        success_rate: session.success_rate || 0,
        difficulty: session.difficulty
      }))
    });

  } catch (error) {
    console.error('Session history error:', error);
    return c.json({ error: '세션 기록을 불러오는 중 오류가 발생했습니다.' }, 500);
  }
});

// 교사 비밀번호 변경
teacher.put('/change-password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { currentPassword, newPassword, confirmPassword } = await c.req.json();

    // 입력 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400);
    }

    if (newPassword !== confirmPassword) {
      return c.json({ error: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.' }, 400);
    }

    if (newPassword.length < 4) {
      return c.json({ error: '새 비밀번호는 최소 4자 이상이어야 합니다.' }, 400);
    }

    // 현재 사용자 정보 조회
    const user = await c.env.DB.prepare(
      'SELECT id, password_hash FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) {
      return c.json({ error: '사용자를 찾을 수 없습니다.' }, 404);
    }

    // 현재 비밀번호 확인 (하이브리드 방식)
    let isCurrentPasswordValid = false;
    
    if (user.password_hash && user.password_hash.startsWith('$2a$')) {
      // bcrypt 해시된 비밀번호인 경우, 일단 에러 처리
      return c.json({ error: 'bcrypt로 해시된 비밀번호는 현재 변경할 수 없습니다. 관리자에게 문의하세요.' }, 400);
    } else if (user.password_hash && user.password_hash.length === 64 && /^[a-f0-9]+$/.test(user.password_hash)) {
      // SHA-256 해시된 비밀번호인 경우
      const { verifyPassword } = await import('../utils/auth');
      isCurrentPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    } else {
      // 평문 비밀번호
      isCurrentPasswordValid = (currentPassword === user.password_hash);
    }

    if (!isCurrentPasswordValid) {
      return c.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, 401);
    }

    // 새 비밀번호 해시화 (Web Crypto API 사용)
    const { hashPassword } = await import('../utils/auth');
    const hashedNewPassword = await hashPassword(newPassword);

    // 비밀번호 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ? WHERE id = ?'
    ).bind(hashedNewPassword, payload.userId).run();

    return c.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });

  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ error: '비밀번호 변경 중 오류가 발생했습니다.' }, 500);
  }
});

// 프로필 업데이트
teacher.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const { full_name, email } = await c.req.json();

    if (!full_name || !email) {
      return c.json({ error: '이름과 이메일은 필수입니다.' }, 400);
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: '올바른 이메일 형식이 아닙니다.' }, 400);
    }

    // 프로필 업데이트
    await c.env.DB.prepare(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?'
    ).bind(full_name, email, payload.userId).run();

    return c.json({ 
      message: '프로필이 성공적으로 업데이트되었습니다.',
      user: { full_name, email }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: '프로필 업데이트 중 오류가 발생했습니다.' }, 500);
  }
});

export default teacher;