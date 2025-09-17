import { Hono } from 'hono';
import { CloudflareBindings, SubmitCodeRequest, ExecuteCodeRequest } from '../types';

const student = new Hono<{ Bindings: CloudflareBindings }>();

// 현재 활성 세션 조회 (학생이 속한 클래스의)
student.get('/sessions/active', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 학생의 클래스 정보 가져오기
    const user = await c.env.DB.prepare(
      'SELECT class_id FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user || !user.class_id) {
      return c.json({ error: '클래스 정보가 없습니다.' }, 400);
    }

    const sessions = await c.env.DB.prepare(`
      SELECT ps.*, p.title as problem_title, p.description as problem_description, 
             p.initial_code, p.expected_output, p.time_limit,
             u.full_name as teacher_name
      FROM problem_sessions ps
      JOIN problems p ON ps.problem_id = p.id
      JOIN users u ON ps.teacher_id = u.id
      WHERE ps.class_id = ? AND ps.status = 'active'
      ORDER BY ps.start_time DESC
    `).bind(user.class_id).all();

    return c.json({ sessions: sessions.results });
  } catch (error) {
    console.error('Get active sessions error:', error);
    return c.json({ error: '활성 세션 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 세션 상세 정보 조회
student.get('/sessions/:id', async (c) => {
  try {
    const sessionId = c.req.param('id');
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    // 학생의 클래스 확인
    const user = await c.env.DB.prepare(
      'SELECT class_id FROM users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user || !user.class_id) {
      return c.json({ error: '클래스 정보가 없습니다.' }, 400);
    }

    const session = await c.env.DB.prepare(`
      SELECT ps.*, p.title as problem_title, p.description as problem_description, 
             p.initial_code, p.expected_output, p.time_limit, p.test_cases,
             u.full_name as teacher_name
      FROM problem_sessions ps
      JOIN problems p ON ps.problem_id = p.id
      JOIN users u ON ps.teacher_id = u.id
      WHERE ps.id = ? AND ps.class_id = ?
    `).bind(sessionId, user.class_id).first();

    if (!session) {
      return c.json({ error: '세션을 찾을 수 없습니다.' }, 404);
    }

    // 학생의 이전 제출 기록 조회
    const submissions = await c.env.DB.prepare(`
      SELECT * FROM submissions 
      WHERE session_id = ? AND student_id = ?
      ORDER BY submitted_at DESC
    `).bind(sessionId, payload.userId).all();

    return c.json({ 
      session: {
        ...session,
        test_cases: JSON.parse(session.test_cases || '[]')
      },
      submissions: submissions.results
    });
  } catch (error) {
    console.error('Get session error:', error);
    return c.json({ error: '세션 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 코드 제출
student.post('/submissions', async (c) => {
  try {
    const submitData: SubmitCodeRequest = await c.req.json();
    
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    const { session_id, code } = submitData;

    if (!session_id || !code) {
      return c.json({ error: '세션 ID와 코드가 필요합니다.' }, 400);
    }

    // 세션 유효성 확인
    const session = await c.env.DB.prepare(`
      SELECT ps.id FROM problem_sessions ps
      JOIN users u ON u.class_id = ps.class_id
      WHERE ps.id = ? AND u.id = ? AND ps.status = 'active'
    `).bind(session_id, payload.userId).first();

    if (!session) {
      return c.json({ error: '유효하지 않은 세션입니다.' }, 404);
    }

    // 코드 실행 시뮬레이션 (실제로는 Pyodide 등을 사용)
    let output = '';
    let error_message = null;
    let status = 'success';
    const execution_time = Math.random() * 1000; // 랜덤 실행 시간

    try {
      // 간단한 코드 검증
      if (code.includes('print(')) {
        output = '실행 결과가 여기에 표시됩니다.';
      } else {
        output = '출력이 없습니다.';
      }
    } catch (err) {
      error_message = '코드 실행 중 오류가 발생했습니다.';
      status = 'error';
    }

    // 제출 기록 저장
    const result = await c.env.DB.prepare(`
      INSERT INTO submissions (session_id, student_id, code, output, error_message, execution_time, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(session_id, payload.userId, code, output, error_message, execution_time, status).run();

    return c.json({ 
      id: result.meta.last_row_id,
      output,
      error_message,
      execution_time,
      status
    });

  } catch (error) {
    console.error('Submit code error:', error);
    return c.json({ error: '코드 제출 중 오류가 발생했습니다.' }, 500);
  }
});

// 개인 연습용 코드 실행
student.post('/execute', async (c) => {
  try {
    const executeData: ExecuteCodeRequest = await c.req.json();
    const { code } = executeData;

    if (!code) {
      return c.json({ error: '코드가 필요합니다.' }, 400);
    }

    // 코드 실행 시뮬레이션
    let output = '';
    let error = null;
    let status = 'success';
    const execution_time = Math.random() * 1000;

    try {
      // 간단한 코드 검증 및 실행 시뮬레이션
      if (code.includes('print(')) {
        // print 문에서 출력할 내용 추출 (매우 단순한 파싱)
        const printMatches = code.match(/print\(["'](.+?)["']\)/g);
        if (printMatches) {
          output = printMatches
            .map(match => match.replace(/print\(["'](.+?)["']\)/, '$1'))
            .join('\n');
        } else {
          output = '실행 완료 (출력 없음)';
        }
      } else if (code.includes('input(')) {
        output = '입력이 필요한 프로그램입니다. 브라우저에서 실행해주세요.';
      } else {
        output = '실행 완료';
      }
    } catch (err) {
      error = '코드 실행 중 오류가 발생했습니다.';
      status = 'error';
    }

    return c.json({ 
      output,
      error,
      execution_time,
      status
    });

  } catch (error) {
    console.error('Execute code error:', error);
    return c.json({ error: '코드 실행 중 오류가 발생했습니다.' }, 500);
  }
});

// 내 제출 기록 조회
student.get('/submissions', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader?.substring(7);
    const payload = JSON.parse(atob(token!.split('.')[1]));

    const submissions = await c.env.DB.prepare(`
      SELECT s.*, ps.title as session_title, p.title as problem_title
      FROM submissions s
      JOIN problem_sessions ps ON s.session_id = ps.id
      JOIN problems p ON ps.problem_id = p.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT 50
    `).bind(payload.userId).all();

    return c.json({ submissions: submissions.results });
  } catch (error) {
    console.error('Get my submissions error:', error);
    return c.json({ error: '제출 기록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

export default student;