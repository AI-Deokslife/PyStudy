import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { CloudflareBindings } from './types'

// 라우트 임포트
import auth from './routes/auth'
import admin from './routes/admin'
import teacher from './routes/teacher'
import student from './routes/student'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// CORS 설정
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}))

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// API 라우트 등록
app.route('/api/auth', auth)
app.route('/api/admin', admin)
app.route('/api/teacher', teacher)
app.route('/api/student', student)

// 메인 페이지 - 로그인 화면
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>파이썬 학습 관리 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
            }
        </style>
    </head>
    <body class="bg-gray-900 text-white">
        <div class="min-h-screen flex items-center justify-center p-4">
            <div class="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div class="text-center mb-8">
                    <i class="fas fa-code text-4xl text-cyan-400 mb-4"></i>
                    <h1 class="text-2xl font-bold text-white mb-2">파이썬 학습 플랫폼</h1>
                    <p class="text-gray-400">은평메디텍고등학교 - 이은덕 선생님</p>
                </div>

                <form id="login-form" class="space-y-6">
                    <div>
                        <label for="username" class="block text-sm font-medium text-gray-300 mb-2">사용자명</label>
                        <input type="text" id="username" name="username" required 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white">
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
                        <input type="password" id="password" name="password" required 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white">
                    </div>

                    <button type="submit" id="login-btn"
                            class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-4 rounded-md transition duration-300">
                        <span id="login-text">로그인</span>
                        <i id="login-spinner" class="fas fa-spinner fa-spin hidden ml-2"></i>
                    </button>
                </form>

                <div id="error-message" class="mt-4 p-3 bg-red-900 border border-red-700 rounded-md text-red-300 text-sm hidden">
                </div>

                <div class="mt-8 text-center text-gray-400 text-sm">
                    <p class="mb-2">테스트 계정:</p>
                    <p>관리자: admin / admin123</p>
                    <p>교사: teacher1 / teacher123</p>
                    <p>학생: student1 / student123</p>
                </div>
            </div>
        </div>

        <script>
            document.getElementById('login-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const loginBtn = document.getElementById('login-btn');
                const loginText = document.getElementById('login-text');
                const loginSpinner = document.getElementById('login-spinner');
                const errorMessage = document.getElementById('error-message');
                
                // 로딩 상태
                loginBtn.disabled = true;
                loginText.textContent = '로그인 중...';
                loginSpinner.classList.remove('hidden');
                errorMessage.classList.add('hidden');
                
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // 토큰 저장
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        
                        // 역할에 따라 리다이렉트
                        switch(data.user.role) {
                            case 'admin':
                                window.location.href = '/admin';
                                break;
                            case 'teacher':
                                window.location.href = '/teacher';
                                break;
                            case 'student':
                                window.location.href = '/student';
                                break;
                        }
                    } else {
                        errorMessage.textContent = data.error || '로그인에 실패했습니다.';
                        errorMessage.classList.remove('hidden');
                    }
                } catch (error) {
                    errorMessage.textContent = '서버 연결에 실패했습니다.';
                    errorMessage.classList.remove('hidden');
                } finally {
                    // 로딩 상태 해제
                    loginBtn.disabled = false;
                    loginText.textContent = '로그인';
                    loginSpinner.classList.add('hidden');
                }
            });
        </script>
    </body>
    </html>
  `)
})

// 관리자 대시보드
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>관리자 대시보드 - 파이썬 학습 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/admin.js"></script>
    </head>
    <body class="bg-gray-900 text-white">
        <div id="app" class="min-h-screen">
            <!-- 관리자 대시보드 내용은 admin.js에서 동적으로 생성 -->
        </div>
    </body>
    </html>
  `)
})

// 교사 대시보드
app.get('/teacher', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>교사 대시보드 - 파이썬 학습 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/teacher.js"></script>
    </head>
    <body class="bg-gray-900 text-white">
        <div id="app" class="min-h-screen">
            <!-- 교사 대시보드 내용은 teacher.js에서 동적으로 생성 -->
        </div>
    </body>
    </html>
  `)
})

// 학생 학습 환경
app.get('/student', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>파이썬 학습 환경</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Pyodide (WebAssembly Python) CDN -->
        <script src="https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"></script>
        <!-- CodeMirror (Syntax Highlighting) CDN -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/student.js"></script>
        <style>
            .CodeMirror {
                height: 100%;
                font-size: 16px;
            }
        </style>
    </head>
    <body class="bg-gray-900 text-white">
        <div id="app" class="min-h-screen">
            <!-- 학생 학습 환경은 student.js에서 동적으로 생성 -->
        </div>
    </body>
    </html>
  `)
})

export default app