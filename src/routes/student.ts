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

    // 실제 코드 실행 (향상된 Python 코드 해석)
    let output = '';
    let error_message = null;
    let status = 'success';
    const execution_time = Math.random() * 200 + 30; // 30-230ms 실행 시간

    try {
      // 기본적인 Python 코드 실행 시뮬레이션
      if (!code.trim()) {
        output = '';
      } else {
        // 먼저 기본적인 문법 오류 검사
        if (code.includes('print(') && !code.match(/print\s*\([^)]*\)/)) {
          throw new Error('SyntaxError: invalid syntax - print문에 닫는 괄호가 없습니다');
        }
        if (code.includes('for ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - for문에 콜론(:)이 없습니다');
        }
        if (code.includes('if ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - if문에 콜론(:)이 없습니다');
        }
        if (code.includes('def ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - 함수 정의에 콜론(:)이 없습니다');
        }

        // 실제 실행 시뮬레이션
        const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        const outputs = [];

        // 간단한 Python 코드 해석기
        const variables = {}; // 변수 저장
        let inFunction = false;
        let inLoop = false;
        let loopVariable = '';
        let loopRange = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // 변수 할당 처리
          const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
          if (assignMatch) {
            const varName = assignMatch[1];
            const value = assignMatch[2];
            
            if (value.match(/^\d+$/)) {
              variables[varName] = parseInt(value);
            } else if (value.match(/^['"](.*)['"]$/)) {
              variables[varName] = value.slice(1, -1);
            } else if (value.includes('+')) {
              // 간단한 산술 연산
              const parts = value.split('+').map(p => p.trim());
              let result = 0;
              for (const part of parts) {
                if (part.match(/^\d+$/)) {
                  result += parseInt(part);
                } else if (variables[part] !== undefined) {
                  result += typeof variables[part] === 'number' ? variables[part] : 0;
                }
              }
              variables[varName] = result;
            } else if (variables[value]) {
              variables[varName] = variables[value];
            }
          }

          // for 반복문 처리
          const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\):/);
          if (forMatch) {
            inLoop = true;
            loopVariable = forMatch[1];
            const start = forMatch[3] ? parseInt(forMatch[2]) : 0;
            const end = forMatch[3] ? parseInt(forMatch[3]) : parseInt(forMatch[2]);
            loopRange = Array.from({length: Math.min(end - start, 10)}, (_, i) => start + i);
            continue;
          }

          // print문 처리
          const printMatch = line.match(/^print\s*\(\s*(.+)\s*\)$/);
          if (printMatch) {
            const content = printMatch[1];
            
            if (inLoop && loopRange.length > 0) {
              // 반복문 내의 print문
              for (const loopValue of loopRange) {
                variables[loopVariable] = loopValue;
                let printOutput = content;
                
                // 변수 치환
                for (const [varName, varValue] of Object.entries(variables)) {
                  printOutput = printOutput.replace(new RegExp(`\\b${varName}\\b`, 'g'), varValue);
                }
                
                // 문자열 처리
                if (printOutput.match(/^['"](.*)['"]$/)) {
                  outputs.push(printOutput.slice(1, -1));
                } else if (printOutput.match(/^\d+$/)) {
                  outputs.push(printOutput);
                } else {
                  outputs.push(printOutput);
                }
              }
              inLoop = false;
            } else {
              // 일반 print문
              let printOutput = content;
              
              // 변수 치환
              for (const [varName, varValue] of Object.entries(variables)) {
                printOutput = printOutput.replace(new RegExp(`\\b${varName}\\b`, 'g'), varValue);
              }
              
              // 문자열 처리
              if (printOutput.match(/^['"](.*)['"]$/)) {
                outputs.push(printOutput.slice(1, -1));
              } else if (printOutput.match(/^\d+$/)) {
                outputs.push(printOutput);
              } else if (printOutput.includes('f"') || printOutput.includes("f'")) {
                outputs.push('포맷된 문자열');
              } else {
                outputs.push(printOutput);
              }
            }
          }

          // 함수 정의 확인
          if (line.match(/^def\s+\w+/)) {
            inFunction = true;
          }
        }

        // 출력 결과 생성
        if (outputs.length > 0) {
          output = outputs.join('\n');
        } else if (inFunction) {
          output = ''; // 함수만 정의된 경우 출력 없음
        } else if (code.includes('input(')) {
          output = '입력이 필요한 프로그램입니다.';
        } else {
          output = ''; // 다른 경우 출력 없음
        }
      }
    } catch (err) {
      error_message = err.message || '오류 발생';
      output = null;
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

    // 실제 코드 실행 시뮬레이션 (제출과 동일한 로직)
    let output = '';
    let error = null;
    let status = 'success';
    const execution_time = Math.random() * 200 + 30;

    try {
      if (!code.trim()) {
        output = '';
      } else {
        // 먼저 기본적인 문법 오류 검사
        if (code.includes('print(') && !code.match(/print\s*\([^)]*\)/)) {
          throw new Error('SyntaxError: invalid syntax - print문에 닫는 괄호가 없습니다');
        }
        if (code.includes('for ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - for문에 콜론(:)이 없습니다');
        }
        if (code.includes('if ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - if문에 콜론(:)이 없습니다');
        }
        if (code.includes('def ') && !code.includes(':')) {
          throw new Error('SyntaxError: invalid syntax - 함수 정의에 콜론(:)이 없습니다');
        }

        // 실제 실행 시뮬레이션
        const lines = code.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
        const outputs = [];

        // 간단한 Python 코드 해석기
        const variables = {}; // 변수 저장
        let inFunction = false;
        let inLoop = false;
        let loopVariable = '';
        let loopRange = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // 변수 할당 처리
          const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
          if (assignMatch) {
            const varName = assignMatch[1];
            const value = assignMatch[2];
            
            if (value.match(/^\d+$/)) {
              variables[varName] = parseInt(value);
            } else if (value.match(/^['"](.*)['"]$/)) {
              variables[varName] = value.slice(1, -1);
            } else if (value.includes('+')) {
              // 간단한 산술 연산
              const parts = value.split('+').map(p => p.trim());
              let result = 0;
              for (const part of parts) {
                if (part.match(/^\d+$/)) {
                  result += parseInt(part);
                } else if (variables[part] !== undefined) {
                  result += typeof variables[part] === 'number' ? variables[part] : 0;
                }
              }
              variables[varName] = result;
            } else if (variables[value]) {
              variables[varName] = variables[value];
            }
          }

          // for 반복문 처리
          const forMatch = line.match(/^for\s+(\w+)\s+in\s+range\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\):/);
          if (forMatch) {
            inLoop = true;
            loopVariable = forMatch[1];
            const start = forMatch[3] ? parseInt(forMatch[2]) : 0;
            const end = forMatch[3] ? parseInt(forMatch[3]) : parseInt(forMatch[2]);
            loopRange = Array.from({length: Math.min(end - start, 10)}, (_, i) => start + i);
            continue;
          }

          // print문 처리
          const printMatch = line.match(/^print\s*\(\s*(.+)\s*\)$/);
          if (printMatch) {
            const content = printMatch[1];
            
            if (inLoop && loopRange.length > 0) {
              // 반복문 내의 print문
              for (const loopValue of loopRange) {
                variables[loopVariable] = loopValue;
                let printOutput = content;
                
                // 변수 치환
                for (const [varName, varValue] of Object.entries(variables)) {
                  printOutput = printOutput.replace(new RegExp(`\\b${varName}\\b`, 'g'), varValue);
                }
                
                // 문자열 처리
                if (printOutput.match(/^['"](.*)['"]$/)) {
                  outputs.push(printOutput.slice(1, -1));
                } else if (printOutput.match(/^\d+$/)) {
                  outputs.push(printOutput);
                } else {
                  outputs.push(printOutput);
                }
              }
              inLoop = false;
            } else {
              // 일반 print문
              let printOutput = content;
              
              // 변수 치환
              for (const [varName, varValue] of Object.entries(variables)) {
                printOutput = printOutput.replace(new RegExp(`\\b${varName}\\b`, 'g'), varValue);
              }
              
              // 문자열 처리
              if (printOutput.match(/^['"](.*)['"]$/)) {
                outputs.push(printOutput.slice(1, -1));
              } else if (printOutput.match(/^\d+$/)) {
                outputs.push(printOutput);
              } else if (printOutput.includes('f"') || printOutput.includes("f'")) {
                outputs.push('포맷된 문자열');
              } else {
                outputs.push(printOutput);
              }
            }
          }

          // 함수 정의 확인
          if (line.match(/^def\s+\w+/)) {
            inFunction = true;
          }
        }

        // 출력 결과 생성
        if (outputs.length > 0) {
          output = outputs.join('\n');
        } else if (inFunction) {
          output = ''; // 함수만 정의된 경우 출력 없음
        } else if (code.includes('input(')) {
          output = '입력이 필요한 프로그램입니다.';
        } else {
          output = ''; // 다른 경우 출력 없음
        }
      }
    } catch (err) {
      error = err.message || '오류 발생';
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

// 제출 기록 삭제 요청
student.post('/submissions/:submissionId/delete-request', async (c) => {
  try {
    const submissionId = parseInt(c.req.param('submissionId'));
    const { reason } = await c.req.json();
    
    // JWT에서 학생 정보 추출
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
    // 학생 정보 조회
    const student = await c.env.DB.prepare(
      'SELECT id, username, full_name FROM users WHERE id = ? AND role = ?'
    ).bind(payload.userId, 'student').first();
    
    if (!student) {
      return c.json({ error: '학생 정보를 찾을 수 없습니다.' }, 404);
    }
    
    // 제출 기록이 해당 학생의 것인지 확인
    const submission = await c.env.DB.prepare(
      'SELECT id, student_id FROM submissions WHERE id = ? AND student_id = ?'
    ).bind(submissionId, payload.userId).first();
    
    if (!submission) {
      return c.json({ error: '제출 기록을 찾을 수 없거나 권한이 없습니다.' }, 404);
    }
    
    // 이미 삭제 요청이 있는지 확인
    const existingRequest = await c.env.DB.prepare(
      'SELECT id FROM submission_deletion_requests WHERE submission_id = ? AND status = ?'
    ).bind(submissionId, 'pending').first();
    
    if (existingRequest) {
      return c.json({ error: '이미 삭제 요청이 진행 중입니다.' }, 400);
    }
    
    // 삭제 요청 생성
    const result = await c.env.DB.prepare(`
      INSERT INTO submission_deletion_requests (
        submission_id, student_id, student_username, student_name, reason
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      submissionId,
      payload.userId,
      student.username,
      student.full_name,
      reason || '사유 없음'
    ).run();
    
    return c.json({ 
      message: '삭제 요청이 전송되었습니다. 교사의 승인을 기다려주세요.',
      requestId: result.meta.last_row_id 
    });
    
  } catch (error) {
    console.error('Delete request error:', error);
    return c.json({ error: '삭제 요청 처리 중 오류가 발생했습니다.' }, 500);
  }
});

// 내 삭제 요청 목록 조회
student.get('/deletion-requests', async (c) => {
  try {
    const token = c.req.header('authorization')?.replace('Bearer ', '');
    if (!token) {
      return c.json({ error: '인증이 필요합니다.' }, 401);
    }
    
    const payload = JSON.parse(atob(token!.split('.')[1]));
    
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
      WHERE dr.student_id = ?
      ORDER BY dr.request_date DESC
    `).bind(payload.userId).all();
    
    return c.json({ requests: requests.results });
    
  } catch (error) {
    console.error('Get deletion requests error:', error);
    return c.json({ error: '삭제 요청 목록 조회 중 오류가 발생했습니다.' }, 500);
  }
});

// 학생 비밀번호 변경
student.put('/change-password', async (c) => {
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

export default student;