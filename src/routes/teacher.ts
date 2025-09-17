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
      SELECT ps.*, p.title as problem_title, p.description as problem_description
      FROM problem_sessions ps
      JOIN problems p ON ps.problem_id = p.id
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
      SELECT s.*, u.full_name as student_name
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

export default teacher;