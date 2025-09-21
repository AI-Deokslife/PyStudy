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
        <title>EunPyeong Python Education - 파이썬 학습 관리 시스템</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
            body {
                font-family: 'Noto Sans KR', sans-serif;
            }
            .gradient-bg {
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            }
            .card-shadow {
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
            }
            .floating-elements {
                position: absolute;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 0;
            }
            .floating-elements div {
                position: absolute;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
        </style>
    </head>
    <body class="gradient-bg min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-center items-center py-4">
                    <div class="flex items-center">
                        <div class="text-2xl font-bold text-emerald-600">EunPyeong Python Education</div>
                        <div class="ml-4 text-2xl font-bold text-gray-600">파이썬 학습 관리 시스템</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="relative min-h-screen flex items-center justify-center p-4">
            <!-- Floating Elements -->
            <div class="floating-elements">
                <div style="left: 10%; top: 20%; width: 60px; height: 60px; animation-delay: 0s;"></div>
                <div style="left: 80%; top: 30%; width: 40px; height: 40px; animation-delay: 2s;"></div>
                <div style="left: 20%; top: 70%; width: 50px; height: 50px; animation-delay: 4s;"></div>
                <div style="right: 10%; top: 60%; width: 35px; height: 35px; animation-delay: 1s;"></div>
            </div>

            <div class="relative z-10 w-full max-w-6xl mx-auto">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <!-- Left Side - Welcome Message -->
                    <div class="text-center lg:text-left text-white">
                        <div class="mb-6">
                            <span class="text-lg font-medium opacity-90">EunPyeong Python Education</span>
                        </div>
                        <h1 class="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                            학생과 함께하는<br>
                            <span class="text-yellow-300">올바른 학습법</span>
                        </h1>
                        <p class="text-xl opacity-90 mb-8">
                            파이썬 프로그래밍을 통해 논리적 사고력과<br>
                            문제해결 능력을 키워보세요
                        </p>
                        
                        <!-- Educational Features -->
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div class="flex items-center bg-white bg-opacity-20 rounded-lg p-4">
                                <div class="bg-yellow-400 rounded-full p-2 mr-3">
                                    <i class="fas fa-code text-white text-lg"></i>
                                </div>
                                <div>
                                    <div class="font-semibold">실시간 코딩</div>
                                    <div class="text-sm opacity-80">브라우저에서 바로</div>
                                </div>
                            </div>
                            <div class="flex items-center bg-white bg-opacity-20 rounded-lg p-4">
                                <div class="bg-blue-400 rounded-full p-2 mr-3">
                                    <i class="fas fa-users text-white text-lg"></i>
                                </div>
                                <div>
                                    <div class="font-semibold">클래스 관리</div>
                                    <div class="text-sm opacity-80">체계적인 학습</div>
                                </div>
                            </div>
                        </div>

                        <!-- Contact Info -->
                        <div class="bg-emerald-600 rounded-xl p-6 text-left">
                            <h3 class="font-bold text-lg mb-4">Contact Us</h3>
                            <div class="space-y-2">
                                <div class="flex items-center">
                                    <i class="fas fa-phone-alt mr-3 text-yellow-300"></i>
                                    <span class="font-semibold">070-4020-6832</span>
                                </div>
                                <div class="flex items-center text-sm opacity-90">
                                    <i class="fas fa-envelope mr-3 text-yellow-300"></i>
                                    <span>deokslife@naver.com</span>
                                </div>
                                <div class="flex items-center text-sm opacity-90">
                                    <i class="fab fa-instagram mr-3 text-yellow-300"></i>
                                    <a href="https://www.instagram.com/eunpyeong.smtcoding/" target="_blank" class="hover:underline">@eunpyeong.smtcoding</a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Side - Login Form -->
                    <div class="flex justify-center lg:justify-end">
                        <div class="bg-white rounded-2xl shadow-2xl card-shadow p-8 w-full max-w-md">
                            <div class="text-center mb-8">
                                <div class="flex justify-center mb-4">
                                    <div class="bg-emerald-100 rounded-full p-4">
                                        <i class="fas fa-graduation-cap text-3xl text-emerald-600"></i>
                                    </div>
                                </div>
                                <h2 class="text-2xl font-bold text-gray-800 mb-2">학습 시작하기</h2>
                                <p class="text-gray-600">파이썬과 함께하는 즐거운 학습 여정</p>
                            </div>

                            <form id="login-form" class="space-y-6">
                                <div>
                                    <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-user mr-2 text-emerald-600"></i>사용자 ID
                                    </label>
                                    <input type="text" id="username" name="username" required 
                                           placeholder="ID를 입력하세요"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 transition-all">
                                </div>
                                
                                <div>
                                    <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                                        <i class="fas fa-lock mr-2 text-emerald-600"></i>비밀번호
                                    </label>
                                    <input type="password" id="password" name="password" required 
                                           placeholder="비밀번호를 입력하세요"
                                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 transition-all">
                                </div>

                                <button type="submit" id="login-btn"
                                        class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105">
                                    <span id="login-text">
                                        <i class="fas fa-sign-in-alt mr-2"></i>학습 시작하기
                                    </span>
                                    <i id="login-spinner" class="fas fa-spinner fa-spin hidden ml-2"></i>
                                </button>
                            </form>

                            <div id="error-message" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm hidden">
                            </div>

                            <!-- Demo Accounts Info -->
                            <div class="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h4 class="font-semibold text-gray-700 mb-2">
                                    <i class="fas fa-info-circle mr-2 text-blue-500"></i>체험 계정
                                </h4>
                                <div class="text-xs text-gray-600 space-y-1">
                                    <div>👩‍🏫 교사: teacher1 / teacher1</div>
                                    <div>👨‍🎓 학생: student1 / student1</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="bg-white py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <div class="text-gray-600 text-sm">
                    © 2025 EunPyeong Python Education. 은평메디텍고등학교 - 이은덕 선생님
                </div>
            </div>
        </footer>

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
        <title>EunPyeong Python Education - 관리자 대시보드</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/admin.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
            body {
                font-family: 'Noto Sans KR', sans-serif;
            }
            .gradient-header {
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            }
            .admin-card {
                transition: all 0.3s ease;
            }
            .admin-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
        </style>
    </head>
    <body class="bg-gray-50">
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
        <title>EunPyeong Python Education - 교사 대시보드</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/teacher.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
            body {
                font-family: 'Noto Sans KR', sans-serif;
            }
            .gradient-header {
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            }
            .card-hover {
                transition: all 0.3s ease;
            }
            .card-hover:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .nav-item {
                transition: all 0.2s ease;
            }
            .nav-item:hover {
                background: rgba(16, 185, 129, 0.1);
                border-left: 4px solid #10b981;
            }
            .nav-item.active {
                background: rgba(16, 185, 129, 0.2);
                border-left: 4px solid #10b981;
            }
        </style>
    </head>
    <body class="bg-gray-50">
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
        <title>EunPyeong Python Education - 파이썬 학습 환경</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Pyodide (WebAssembly Python) CDN -->
        <script src="https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js"></script>
        <!-- CodeMirror (Syntax Highlighting) CDN -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/eclipse.min.css">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/student.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
            @font-face {
                font-family: 'SchoolSafetyGoodSupport';
                src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2307-2@1.0/HakgyoansimBareondotumB.woff2') format('woff2');
                font-weight: 700;
                font-display: swap;
            }
            body {
                font-family: 'Noto Sans KR', sans-serif;
            }
            .CodeMirror {
                height: 100%;
                font-size: 16px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                font-family: 'SchoolSafetyGoodSupport', 'Monaco', 'Consolas', 'Courier New', monospace !important;
            }
            .CodeMirror-lines {
                font-family: 'SchoolSafetyGoodSupport', 'Monaco', 'Consolas', 'Courier New', monospace !important;
            }
            .gradient-header {
                background: linear-gradient(135deg, #10b981 0%, #047857 100%);
            }
            .learning-card {
                transition: all 0.3s ease;
            }
            .learning-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <div id="app" class="min-h-screen">
            <!-- 학생 학습 환경은 student.js에서 동적으로 생성 -->
        </div>
    </body>
    </html>
  `)
})

export default app