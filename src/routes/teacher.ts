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

export default teacher;