// 교사 대시보드 JavaScript

class TeacherDashboard {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!this.token || this.user.role !== 'teacher') {
            window.location.href = '/';
            return;
        }
        
        this.currentPollingInterval = null;
        this.init();
    }
    
    init() {
        this.renderHeader();
        this.renderNavigation();
        this.showProblemManagement();
    }
    
    // 한국 시간으로 포맷팅하는 공통 함수
    formatKoreanTime(dateString, includeSeconds = false) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        
        // UTC 시간에 9시간(KST 오프셋) 추가
        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const year = koreanTime.getUTCFullYear();
        const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(koreanTime.getUTCDate()).padStart(2, '0');
        const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
        const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(koreanTime.getUTCSeconds()).padStart(2, '0');
        
        let timeStr = `${year}.${month}.${day} ${hours}:${minutes}`;
        if (includeSeconds) {
            timeStr += `:${seconds}`;
        }
        
        return timeStr;
    }
    
    // 시간만 표시하는 함수
    formatKoreanTimeOnly(dateString, includeSeconds = false) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        
        // UTC 시간에 9시간(KST 오프셋) 추가
        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
        const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(koreanTime.getUTCSeconds()).padStart(2, '0');
        
        let timeStr = `${hours}:${minutes}`;
        if (includeSeconds) {
            timeStr += `:${seconds}`;
        }
        
        return timeStr;
    }
    
    renderHeader() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- 모바일 메뉴 토글 버튼 -->
            <button id="mobile-menu-toggle" class="md:hidden fixed top-4 left-4 z-50 bg-emerald-600 hover:bg-emerald-700 p-3 rounded-lg shadow-lg">
                <i class="fas fa-bars text-white"></i>
            </button>
            
            <!-- 모바일 오버레이 -->
            <div id="mobile-overlay" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 hidden"></div>
            
            <header class="gradient-header shadow-lg sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <div class="md:hidden w-8"></div> <!-- 모바일 메뉴 버튼 공간 확보 -->
                            <div class="flex items-center">
                                <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                                    <i class="fas fa-graduation-cap text-xl md:text-2xl text-white"></i>
                                </div>
                                <div>
                                    <h1 class="text-lg md:text-xl font-bold text-white">EunPyeong Python Education</h1>
                                    <div class="text-xs text-emerald-100 hidden sm:block">교사 대시보드</div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 md:space-x-4">
                            <div class="hidden sm:flex items-center bg-white bg-opacity-20 rounded-full px-3 py-1">
                                <i class="fas fa-user-circle text-white mr-2"></i>
                                <span class="text-white text-sm md:text-base">${this.user.full_name} 선생님</span>
                            </div>
                            <button onclick="teacherDashboard.logout()" class="bg-red-500 hover:bg-red-600 px-3 md:px-4 py-2 rounded-lg text-white text-sm md:text-base transition-colors shadow-lg">
                                <i class="fas fa-sign-out-alt mr-1 md:mr-2"></i><span class="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="flex min-h-screen bg-gray-50">
                <!-- 데스크톱 사이드바 -->
                <nav id="sidebar" class="hidden md:block w-72 bg-white shadow-xl border-r border-gray-200">
                    <!-- 네비게이션 메뉴 -->
                </nav>
                
                <!-- 모바일 사이드바 -->
                <nav id="mobile-sidebar" class="md:hidden fixed left-0 top-0 h-full w-64 bg-gray-800 shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out z-40">
                    <!-- 네비게이션 메뉴 (모바일) -->
                </nav>
                
                <main id="main-content" class="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    <!-- 메인 콘텐츠 -->
                </main>
            </div>
        `;
    }
    
    renderNavigation() {
        const navigationHTML = `
            <!-- 프로필 섹션 -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="bg-emerald-100 rounded-full p-3 mr-4">
                            <i class="fas fa-user-tie text-emerald-600 text-xl"></i>
                        </div>
                        <div>
                            <div class="font-semibold text-gray-800">${this.user.full_name}</div>
                            <div class="text-sm text-emerald-600">교사</div>
                        </div>
                    </div>
                    <button onclick="teacherDashboard.showProfileEditModal();" 
                            class="text-gray-400 hover:text-emerald-600 transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-4">
                <ul class="space-y-2">
                    <li>
                        <button onclick="teacherDashboard.showProblemManagement(); teacherDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-puzzle-piece text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">문제 관리</div>
                                <div class="text-xs text-gray-500">문제 생성 및 편집</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="teacherDashboard.showClassManagement(); teacherDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-green-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-users text-emerald-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">클래스 관리</div>
                                <div class="text-xs text-gray-500">학생 그룹 관리</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="teacherDashboard.showLiveSession(); teacherDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-red-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-broadcast-tower text-red-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">실시간 세션</div>
                                <div class="text-xs text-gray-500">라이브 수업 진행</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="teacherDashboard.showSessionHistory(); teacherDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-purple-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-history text-purple-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">세션 기록</div>
                                <div class="text-xs text-gray-500">수업 이력 관리</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="teacherDashboard.showStudentProgress(); teacherDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-orange-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-chart-line text-orange-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">학생 진도</div>
                                <div class="text-xs text-gray-500">학습 현황 분석</div>
                            </div>
                        </button>
                    </li>
                </ul>
                
                <!-- 관리 섹션 -->
                <div class="mt-6">
                    <h3 class="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">관리</h3>
                    <ul class="space-y-2">
                        <li>
                            <button onclick="teacherDashboard.showDeletionRequests(); teacherDashboard.closeMobileMenu();" 
                                    class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                                <div class="bg-yellow-100 p-2 rounded-lg mr-3">
                                    <i class="fas fa-trash-restore text-yellow-600"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="font-medium">삭제 요청</div>
                                    <div class="text-xs text-gray-500">학생 요청 처리</div>
                                </div>
                                <span id="pending-requests-badge" class="bg-red-500 text-white text-xs rounded-full px-2 py-1 hidden">0</span>
                            </button>
                        </li>
                        <li>
                            <button onclick="teacherDashboard.showAccountSettings(); teacherDashboard.closeMobileMenu();" 
                                    class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                                <div class="bg-gray-100 p-2 rounded-lg mr-3">
                                    <i class="fas fa-cog text-gray-600"></i>
                                </div>
                                <div>
                                    <div class="font-medium">계정 설정</div>
                                    <div class="text-xs text-gray-500">개인정보 관리</div>
                                </div>
                            </button>
                        </li>
                    </ul>
                </div>
                </ul>
            </div>
        `;
        
        // 데스크톱 사이드바
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.innerHTML = navigationHTML;
        }
        
        // 모바일 사이드바
        const mobileSidebar = document.getElementById('mobile-sidebar');
        if (mobileSidebar) {
            mobileSidebar.className = "md:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out z-40";
            mobileSidebar.innerHTML = `
                <div class="gradient-header p-4 text-white">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="bg-white bg-opacity-20 rounded-full p-2 mr-3">
                                <i class="fas fa-graduation-cap text-white"></i>
                            </div>
                            <h2 class="text-lg font-semibold text-white">EunPyeong Python Education</h2>
                        </div>
                        <button onclick="teacherDashboard.closeMobileMenu()" class="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                ${navigationHTML}
            `;
        }
        
        // 모바일 메뉴 이벤트 리스너
        this.setupMobileMenu();
    }
    
    setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileMenu());
        }
        
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => this.closeMobileMenu());
        }
    }
    
    toggleMobileMenu() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileSidebar && mobileOverlay) {
            mobileSidebar.classList.toggle('-translate-x-full');
            mobileOverlay.classList.toggle('hidden');
        }
    }
    
    closeMobileMenu() {
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const mobileOverlay = document.getElementById('mobile-overlay');
        
        if (mobileSidebar && mobileOverlay) {
            mobileSidebar.classList.add('-translate-x-full');
            mobileOverlay.classList.add('hidden');
        }
    }
    
    async showProblemManagement() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">문제 관리</h2>
                    <button onclick="teacherDashboard.showCreateProblemForm()" 
                            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-white shadow-lg transition-all hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>문제 생성
                    </button>
                </div>
                
                <div id="problems-list" class="space-y-4">
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin text-2xl text-emerald-500"></i>
                        <p class="text-gray-600 mt-2">문제 목록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadProblems();
    }
    
    async loadProblems() {
        try {
            const response = await fetch('/api/teacher/problems', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderProblemsList(data.problems);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('problems-list').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
                    <p class="text-red-600 mt-2">문제 목록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderProblemsList(problems) {
        const problemsList = document.getElementById('problems-list');
        
        if (problems.length === 0) {
            problemsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-tasks text-4xl text-emerald-400"></i>
                    <p class="text-gray-600 mt-4">아직 생성한 문제가 없습니다.</p>
                    <button onclick="teacherDashboard.showCreateProblemForm()" 
                            class="mt-4 bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded text-white shadow-lg transition-all hover:shadow-xl">
                        첫 번째 문제 만들기
                    </button>
                </div>
            `;
            return;
        }
        
        problemsList.innerHTML = problems.map(problem => `
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800">${problem.title}</h3>
                        <p class="text-gray-600 mt-1">${problem.description}</p>
                        <div class="flex items-center mt-2 space-x-4">
                            <span class="px-2 py-1 bg-${this.getDifficultyColor(problem.difficulty)}-100 text-${this.getDifficultyColor(problem.difficulty)}-700 text-xs rounded">
                                ${this.getDifficultyText(problem.difficulty)}
                            </span>
                            <span class="text-gray-500 text-sm">
                                <i class="fas fa-clock mr-1 text-emerald-500"></i>${problem.time_limit}초
                            </span>
                            <span class="text-gray-500 text-sm">
                                <i class="fas fa-calendar mr-1 text-emerald-500"></i>${new Date(problem.created_at).toLocaleDateString('ko-KR')}
                            </span>
                        </div>
                    </div>
                    <div class="ml-4 space-x-2">
                        <button onclick="teacherDashboard.startSession(${problem.id}, '${problem.title}')" 
                                class="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-play mr-1"></i>시작
                        </button>
                        <button onclick="teacherDashboard.showEditProblemForm(${problem.id})" 
                                class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-edit mr-1"></i>편집
                        </button>
                        <button onclick="teacherDashboard.deleteProblem(${problem.id}, '${problem.title}')" 
                                class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getDifficultyColor(difficulty) {
        switch (difficulty) {
            case 'easy': return 'green';
            case 'medium': return 'yellow';
            case 'hard': return 'red';
            default: return 'gray';
        }
    }
    
    getDifficultyText(difficulty) {
        switch (difficulty) {
            case 'easy': return '쉬움';
            case 'medium': return '보통';
            case 'hard': return '어려움';
            default: return difficulty;
        }
    }
    
    showCreateProblemForm() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-white rounded-lg shadow-xl p-6 border border-gray-200">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">문제 생성</h2>
                    <button onclick="teacherDashboard.showProblemManagement()" 
                            class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors">
                        <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                    </button>
                </div>
                
                <form id="create-problem-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">문제 제목</label>
                        <input type="text" name="title" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                               placeholder="예: 변수와 출력">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">문제 설명</label>
                        <textarea name="description" required rows="4"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                  placeholder="문제에 대한 자세한 설명을 입력하세요..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">초기 코드 (선택사항)</label>
                            <textarea name="initial_code" rows="4"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                      placeholder="# 학생에게 제공할 초기 코드&#10;print('Hello, World!')"></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">예상 출력 (선택사항)</label>
                            <textarea name="expected_output" rows="4"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                      placeholder="예상되는 출력 결과"></textarea>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">제한 시간 (초)</label>
                            <input type="number" name="time_limit" value="30" min="10" max="300"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">메모리 제한 (MB)</label>
                            <input type="number" name="memory_limit" value="128" min="64" max="512"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">난이도</label>
                            <select name="difficulty" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                                <option value="easy">쉬움</option>
                                <option value="medium">보통</option>
                                <option value="hard">어려움</option>
                            </select>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded transition-colors shadow-lg hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>문제 생성
                    </button>
                </form>
                
                <div id="create-problem-result" class="mt-4 hidden"></div>
            </div>
        `;
        
        document.getElementById('create-problem-form').addEventListener('submit', this.handleCreateProblem.bind(this));
    }
    
    async handleCreateProblem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const problemData = Object.fromEntries(formData.entries());
        
        // 테스트 케이스는 간단히 빈 배열로 설정
        problemData.test_cases = [];
        
        try {
            const response = await fetch('/api/teacher/problems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(problemData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('create-problem-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>문제가 성공적으로 생성되었습니다.
                    </div>
                `;
                e.target.reset();
                setTimeout(() => this.showProblemManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('create-problem-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>문제 생성 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    async startSession(problemId, problemTitle) {
        // 더 나은 UI로 입력 받기
        this.showSessionStartModal(problemId, problemTitle);
    }
    
    async showSessionStartModal(problemId, problemTitle) {
        const mainContent = document.getElementById('main-content');
        const existingModal = document.getElementById('session-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 클래스 목록 로드
        let classOptions = '<option value="">클래스를 선택하세요...</option>';
        try {
            const response = await fetch('/api/teacher/classes', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();
            if (response.ok && data.classes && data.classes.length > 0) {
                classOptions = data.classes.map(cls => 
                    `<option value="${cls.id}">${cls.id} - ${cls.name}</option>`
                ).join('');
            } else {
                classOptions = '<option value="">클래스가 없습니다. 먼저 클래스를 생성해주세요.</option>';
            }
        } catch (error) {
            console.error('클래스 목록 로드 오류:', error);
            classOptions = '<option value="">클래스 목록 로드 실패</option>';
        }
        
        const modal = document.createElement('div');
        modal.id = 'session-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h3 class="text-xl font-bold mb-4 text-white">문제 세션 시작</h3>
                <p class="text-gray-400 mb-4 text-sm">문제: <strong class="text-white">${problemTitle}</strong></p>
                
                <form id="session-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">세션 제목</label>
                        <input type="text" id="session-title" value="${problemTitle}" required
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">클래스 선택</label>
                        <select id="session-class" required
                                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            ${classOptions}
                        </select>
                    </div>
                    
                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" onclick="document.getElementById('session-modal').remove()" 
                                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">취소</button>
                        <button type="submit" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                            <i class="fas fa-play mr-2"></i>세션 시작
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('session-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('session-title').value.trim();
            const classId = document.getElementById('session-class').value.trim();
            
            if (title && classId) {
                this.createSession(problemId, title, classId);
                modal.remove();
            }
        });
        
        // 첫 번째 입력 필드에 포커스
        setTimeout(() => document.getElementById('session-title').focus(), 100);
    }
    
    async createSession(problemId, title, classId) {
        
        try {
            const response = await fetch('/api/teacher/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    problem_id: problemId,
                    class_id: classId,
                    title: title
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 성공 알림과 함께 실시간 세션으로 이동
                const successModal = document.createElement('div');
                successModal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
                successModal.innerHTML = `
                    <div class="bg-green-800 p-6 rounded-lg shadow-xl border border-green-600">
                        <div class="text-center">
                            <i class="fas fa-check-circle text-4xl text-green-300 mb-4"></i>
                            <h3 class="text-xl font-bold text-white mb-2">세션이 시작되었습니다!</h3>
                            <p class="text-green-200 mb-4">${title}</p>
                            <p class="text-green-300 text-sm mb-4">학생들에게 알림이 전송되었습니다.</p>
                            <button onclick="this.parentElement.parentElement.parentElement.remove(); teacherDashboard.showLiveSession();" 
                                    class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded text-white">
                                실시간 모니터링 시작
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(successModal);
                
                // 3초 후 자동으로 실시간 세션으로 이동
                setTimeout(() => {
                    successModal.remove();
                    this.showLiveSession();
                }, 3000);
            } else {
                alert(`세션 시작 실패: ${data.error}`);
            }
        } catch (error) {
            alert('세션 시작 중 오류가 발생했습니다.');
        }
    }
    
    async showLiveSession() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">실시간 세션 관리</h2>
                    <div id="live-status" class="flex items-center">
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span class="text-green-400 text-sm">실시간 업데이트</span>
                    </div>
                </div>
                
                <div id="active-sessions" class="space-y-4 mb-8">
                    <div class="text-center py-4">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p class="text-gray-400 mt-2">활성 세션을 확인하는 중...</p>
                    </div>
                </div>
                
                <div id="live-submissions" class="bg-gray-700 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-white">
                            <i class="fas fa-users mr-2"></i>실시간 제출 현황
                        </h3>
                        <div class="text-sm text-gray-400">
                            <i class="fas fa-info-circle mr-1"></i>학생 이름을 클릭하면 상세 내용을 볼 수 있습니다
                        </div>
                    </div>
                    <div id="submissions-list">
                        <div class="text-center py-8 bg-gray-800 rounded">
                            <i class="fas fa-clipboard-list text-3xl text-gray-500 mb-3"></i>
                            <p class="text-gray-400">활성 세션을 선택하면 실시간 제출 현황을 볼 수 있습니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadActiveSessions();
        this.startPolling();
    }
    
    async loadActiveSessions() {
        try {
            const response = await fetch('/api/teacher/sessions/active', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderActiveSessions(data.sessions);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('active-sessions').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                    <p class="text-red-400 mt-2">세션 정보를 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderActiveSessions(sessions) {
        const activeSessionsDiv = document.getElementById('active-sessions');
        
        if (sessions.length === 0) {
            activeSessionsDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-broadcast-tower text-4xl text-gray-400"></i>
                    <p class="text-gray-400 mt-4">현재 활성 세션이 없습니다.</p>
                    <button onclick="teacherDashboard.showProblemManagement()" 
                            class="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white">
                        문제 관리로 이동
                    </button>
                </div>
            `;
            return;
        }
        
        activeSessionsDiv.innerHTML = sessions.map(session => `
            <div class="bg-green-900 border border-green-700 p-4 rounded-lg">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <div class="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <h3 class="text-lg font-semibold text-white">${session.title}</h3>
                            <span class="ml-2 px-2 py-1 bg-green-700 text-green-100 text-xs rounded">활성</span>
                        </div>
                        <p class="text-green-200 mb-2">${session.problem_title}</p>
                        <p class="text-green-300 text-sm">
                            출제자: ${session.teacher_name || '나'}
                        </p>
                        <p class="text-green-300 text-sm">
                            시작 시간: ${this.formatKoreanTime(session.start_time)}
                        </p>
                        <p class="text-green-300 text-sm">
                            클래스: ${session.class_id}
                        </p>
                    </div>
                    <div class="ml-4 space-x-2">
                        <button onclick="teacherDashboard.loadSessionSubmissions(${session.id})" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm">
                            <i class="fas fa-eye mr-1"></i>모니터링
                        </button>
                        <button onclick="teacherDashboard.endSession(${session.id})" 
                                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm">
                            <i class="fas fa-stop mr-1"></i>종료
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async loadSessionSubmissions(sessionId) {
        this.currentSessionId = sessionId;
        
        try {
            const response = await fetch(`/api/teacher/sessions/${sessionId}/submissions`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderSubmissions(data.submissions);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('submissions-list').innerHTML = `
                <p class="text-red-400">제출 현황을 불러오는데 실패했습니다.</p>
            `;
        }
    }
    
    renderSubmissions(submissions) {
        const submissionsList = document.getElementById('submissions-list');
        
        if (submissions.length === 0) {
            submissionsList.innerHTML = `
                <p class="text-gray-400">아직 제출된 코드가 없습니다.</p>
            `;
            return;
        }
        
        submissionsList.innerHTML = `
            <!-- 제출 관리 툴바 -->
            <div class="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-600">
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="select-all-submissions" onchange="teacherDashboard.toggleSelectAll()" 
                                   class="mr-2 bg-gray-700 border-gray-600 rounded focus:ring-blue-500">
                            <span class="text-gray-300">전체 선택</span>
                        </label>
                        <span id="selected-count" class="text-gray-400 text-sm">0개 선택됨</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="teacherDashboard.downloadSelected()" 
                                class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white text-sm" 
                                id="download-selected-btn" disabled>
                            <i class="fas fa-download mr-1"></i>선택 다운로드
                        </button>
                        <button onclick="teacherDashboard.downloadAll()" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-sm">
                            <i class="fas fa-download mr-1"></i>전체 다운로드
                        </button>
                        <button onclick="teacherDashboard.deleteSelected()" 
                                class="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white text-sm" 
                                id="delete-selected-btn" disabled>
                            <i class="fas fa-trash mr-1"></i>선택 삭제
                        </button>
                        <button onclick="teacherDashboard.deleteAll()" 
                                class="bg-red-800 hover:bg-red-900 px-3 py-2 rounded text-white text-sm">
                            <i class="fas fa-trash-alt mr-1"></i>전체 삭제
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- 제출 목록 -->
            <div class="space-y-3">
                ${submissions.map(submission => `
                    <div class="bg-gray-800 p-4 rounded border-l-4 ${this.getSubmissionBorderColor(submission.status)}">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center">
                                <input type="checkbox" class="submission-checkbox mr-3 bg-gray-700 border-gray-600 rounded focus:ring-blue-500" 
                                       value="${submission.id}" onchange="teacherDashboard.updateSelectionCount()">
                                <button onclick="teacherDashboard.showSubmissionDetail(${JSON.stringify(submission).replace(/"/g, '&quot;')})" 
                                        class="font-semibold text-white hover:text-cyan-400 cursor-pointer transition-colors">
                                    ${submission.student_name}
                                </button>
                                <span class="ml-2 text-gray-500 text-sm">(${submission.student_username})</span>
                                <span class="ml-2 px-2 py-1 ${this.getSubmissionBadgeColor(submission.status)} text-xs rounded">
                                    ${this.getSubmissionStatusText(submission.status)}
                                </span>
                                <span class="ml-2 text-gray-400 text-sm">
                                    ${this.formatKoreanTimeOnly(submission.submitted_at)}
                                </span>
                            </div>
                        </div>
                        
                        <!-- 제출된 코드 미리보기 -->
                        <div class="bg-gray-900 p-3 rounded mb-3">
                            <h4 class="text-gray-400 text-xs mb-2">제출 코드:</h4>
                            <pre class="text-green-300 font-mono text-sm overflow-x-auto">${this.truncateCode(submission.code)}</pre>
                        </div>
                        
                        <!-- 실행 결과 -->
                        <div class="grid grid-cols-1 gap-2">
                            ${submission.status === 'error' ? `
                                <div class="bg-red-900 p-2 rounded">
                                    <span class="text-red-300 text-xs">실행 결과:</span>
                                    <pre class="text-red-200 text-sm mt-1">오류 발생</pre>
                                    ${submission.error_message ? `<pre class="text-red-300 text-xs mt-1">${submission.error_message}</pre>` : ''}
                                </div>
                            ` : submission.output ? `
                                <div class="bg-gray-700 p-2 rounded">
                                    <span class="text-gray-400 text-xs">실행 결과:</span>
                                    <pre class="text-gray-300 text-sm mt-1">${submission.output}</pre>
                                </div>
                            ` : `
                                <div class="bg-gray-700 p-2 rounded">
                                    <span class="text-gray-400 text-xs">실행 결과:</span>
                                    <pre class="text-gray-400 text-sm mt-1">출력이 없습니다.</pre>
                                </div>
                            `}
                            ${submission.execution_time ? `
                                <p class="text-gray-400 text-xs">⏱️ 실행시간: ${submission.execution_time.toFixed(2)}ms</p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    truncateCode(code) {
        if (!code) return '코드 없음';
        const lines = code.split('\n');
        if (lines.length <= 3) {
            return code;
        }
        return lines.slice(0, 3).join('\n') + `\n... (총 ${lines.length}줄, 클릭하여 전체 보기)`;
    }
    
    showSubmissionDetail(submission) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">
                <div class="flex justify-between items-center p-6 border-b border-gray-700">
                    <div>
                        <h3 class="text-xl font-bold text-white">${submission.student_name} (${submission.student_username})</h3>
                        <p class="text-gray-400 text-sm">제출 시간: ${this.formatKoreanTime(submission.submitted_at, true)}</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="px-3 py-1 ${this.getSubmissionBadgeColor(submission.status)} text-sm rounded">
                            ${this.getSubmissionStatusText(submission.status)}
                        </span>
                        <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                                class="text-gray-400 hover:text-white">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- 제출된 코드 -->
                        <div>
                            <h4 class="text-lg font-semibold text-white mb-3">
                                <i class="fas fa-code mr-2"></i>제출 코드
                            </h4>
                            <div class="bg-gray-900 p-4 rounded border border-gray-600">
                                <pre class="text-green-300 font-mono text-sm whitespace-pre-wrap overflow-x-auto">${submission.code || '코드 없음'}</pre>
                            </div>
                        </div>
                        
                        <!-- 실행 결과 -->
                        <div>
                            <h4 class="text-lg font-semibold text-white mb-3">
                                <i class="fas fa-terminal mr-2"></i>실행 결과
                            </h4>
                            
                            ${submission.output ? `
                                <div class="mb-4">
                                    <h5 class="text-sm font-medium text-gray-300 mb-2">출력:</h5>
                                    <div class="bg-gray-900 p-3 rounded border border-gray-600">
                                        <pre class="text-gray-300 text-sm whitespace-pre-wrap">${submission.output}</pre>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${submission.error_message ? `
                                <div class="mb-4">
                                    <h5 class="text-sm font-medium text-red-300 mb-2">오류:</h5>
                                    <div class="bg-red-900 p-3 rounded border border-red-700">
                                        <pre class="text-red-200 text-sm whitespace-pre-wrap">${submission.error_message}</pre>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${submission.execution_time ? `
                                <div class="mb-4">
                                    <h5 class="text-sm font-medium text-gray-300 mb-2">성능:</h5>
                                    <div class="bg-gray-900 p-3 rounded border border-gray-600">
                                        <p class="text-gray-300 text-sm">실행시간: ${submission.execution_time.toFixed(2)}ms</p>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${!submission.output && !submission.error_message ? `
                                <div class="bg-gray-900 p-4 rounded border border-gray-600 text-center">
                                    <p class="text-gray-400">실행 결과가 없습니다.</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- 추가 정보 -->
                    <div class="mt-6 pt-4 border-t border-gray-700">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div class="bg-gray-700 p-3 rounded">
                                <span class="text-gray-400">제출 ID:</span>
                                <span class="text-white ml-2">#${submission.id}</span>
                            </div>
                            <div class="bg-gray-700 p-3 rounded">
                                <span class="text-gray-400">상태:</span>
                                <span class="text-white ml-2">${this.getSubmissionStatusText(submission.status)}</span>
                            </div>
                            <div class="bg-gray-700 p-3 rounded">
                                <span class="text-gray-400">코드 길이:</span>
                                <span class="text-white ml-2">${submission.code ? submission.code.length : 0}자</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // ESC 키로 닫기
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
        
        // 배경 클릭으로 닫기
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        });
    }
    
    getSubmissionBorderColor(status) {
        switch (status) {
            case 'success': return 'border-green-500';
            case 'error': return 'border-red-500';
            case 'timeout': return 'border-yellow-500';
            default: return 'border-gray-500';
        }
    }
    
    getSubmissionBadgeColor(status) {
        switch (status) {
            case 'success': return 'bg-green-900 text-green-300';
            case 'error': return 'bg-red-900 text-red-300';
            case 'timeout': return 'bg-yellow-900 text-yellow-300';
            default: return 'bg-gray-700 text-gray-300';
        }
    }
    
    getSubmissionStatusText(status) {
        switch (status) {
            case 'success': return '성공';
            case 'error': return '오류';
            case 'timeout': return '시간초과';
            case 'pending': return '대기중';
            default: return status;
        }
    }
    
    async endSession(sessionId) {
        if (!confirm('정말로 이 세션을 종료하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/sessions/${sessionId}/end`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                alert('세션이 종료되었습니다.');
                this.loadActiveSessions(); // 세션 목록 새로고침
                document.getElementById('submissions-list').innerHTML = `
                    <p class="text-gray-400">세션이 종료되었습니다.</p>
                `;
            } else {
                const data = await response.json();
                alert(`세션 종료 실패: ${data.error}`);
            }
        } catch (error) {
            alert('세션 종료 중 오류가 발생했습니다.');
        }
    }
    
    startPolling() {
        if (this.currentPollingInterval) {
            clearInterval(this.currentPollingInterval);
        }
        
        this.currentPollingInterval = setInterval(() => {
            this.loadActiveSessions();
            if (this.currentSessionId) {
                this.loadSessionSubmissions(this.currentSessionId);
            }
        }, 3000); // 3초마다 업데이트
    }
    
    stopPolling() {
        if (this.currentPollingInterval) {
            clearInterval(this.currentPollingInterval);
            this.currentPollingInterval = null;
        }
        this.currentSessionId = null;
    }
    
    async showSessionHistory() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 class="text-2xl font-bold text-white">세션 기록</h2>
                    <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <select id="class-filter" class="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded">
                            <option value="">전체 클래스</option>
                        </select>
                        <input type="date" id="date-filter" class="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded">
                        <button onclick="teacherDashboard.filterSessionHistory()" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                            <i class="fas fa-search mr-2"></i>필터
                        </button>
                    </div>
                </div>
                
                <div id="session-history-content">
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p class="text-gray-400 mt-4">세션 기록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadSessionHistory();
    }
    
    async loadSessionHistory() {
        try {
            const response = await fetch('/api/teacher/sessions/history', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderSessionHistory(data.sessions);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('session-history-content').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-3xl text-red-400"></i>
                    <p class="text-red-400 mt-4">세션 기록을 불러오는데 실패했습니다.</p>
                    <button onclick="teacherDashboard.loadSessionHistory()" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                        다시 시도
                    </button>
                </div>
            `;
        }
    }
    
    renderSessionHistory(sessions) {
        const content = document.getElementById('session-history-content');
        
        if (!sessions || sessions.length === 0) {
            content.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-history text-3xl text-gray-400"></i>
                    <p class="text-gray-400 mt-4">아직 완료된 세션이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        content.innerHTML = `
            <div class="space-y-4">
                ${sessions.map(session => `
                    <div class="bg-gray-700 p-4 rounded-lg border border-gray-600">
                        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                            <div class="flex-1">
                                <div class="flex items-center mb-2">
                                    <h3 class="text-lg font-semibold text-white mr-3">${session.problem_title}</h3>
                                    <span class="px-2 py-1 ${session.status === 'ended' ? 'bg-gray-600 text-gray-300' : 'bg-green-600 text-green-100'} text-xs rounded">
                                        ${session.status === 'ended' ? '완료' : '진행중'}
                                    </span>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-300">
                                    <div>
                                        <i class="fas fa-calendar mr-2"></i>
                                        시작: ${this.formatKoreanTime(session.start_time)}
                                    </div>
                                    <div>
                                        <i class="fas fa-clock mr-2"></i>
                                        종료: ${session.end_time ? this.formatKoreanTime(session.end_time) : '진행중'}
                                    </div>
                                    <div>
                                        <i class="fas fa-users mr-2"></i>
                                        참여: ${session.submission_count || 0}명
                                    </div>
                                    <div>
                                        <i class="fas fa-check-circle mr-2"></i>
                                        정답률: ${session.success_rate ? Math.round(session.success_rate) : 0}%
                                    </div>
                                </div>
                                <div class="mt-2 text-sm text-gray-400">
                                    <span class="mr-4">클래스: ${session.class_id}</span>
                                    <span>총 제출: ${session.total_submissions || 0}회</span>
                                </div>
                            </div>
                            <div class="flex flex-row lg:flex-col gap-2">
                                <button onclick="teacherDashboard.viewSessionDetail(${session.id})" 
                                        class="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-white text-sm flex-1 lg:flex-none">
                                    <i class="fas fa-eye mr-2"></i>상세보기
                                </button>
                                ${session.status === 'ended' ? `
                                    <button onclick="teacherDashboard.downloadSessionReport(${session.id})" 
                                            class="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white text-sm flex-1 lg:flex-none">
                                        <i class="fas fa-download mr-2"></i>보고서
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    async viewSessionDetail(sessionId) {
        // 세션 상세 보기 - 기존 loadSessionSubmissions 재사용
        await this.loadSessionSubmissions(sessionId);
        
        // 상세 모드임을 표시
        const mainContent = document.getElementById('main-content');
        const header = mainContent.querySelector('h2');
        if (header) {
            header.innerHTML = `
                <div class="flex items-center">
                    <button onclick="teacherDashboard.showSessionHistory()" class="mr-4 text-gray-400 hover:text-white">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    세션 상세 정보
                </div>
            `;
        }
    }
    
    async downloadSessionReport(sessionId) {
        try {
            const response = await fetch(`/api/teacher/sessions/${sessionId}/submissions/download`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.downloadExcel(data.submissions, `session_${sessionId}_report_${new Date().toISOString().slice(0, 10)}`);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert('보고서 다운로드에 실패했습니다.');
        }
    }
    
    filterSessionHistory() {
        // 필터 기능 구현 (추후 확장 가능)
        this.loadSessionHistory();
    }
    
    showStudentProgress() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">학생 진도</h2>
                <div class="text-center py-8">
                    <i class="fas fa-construction text-4xl text-gray-400"></i>
                    <p class="text-gray-400 mt-4">학생 진도 기능은 개발 중입니다.</p>
                </div>
            </div>
        `;
    }
    
    // 제출 관리 함수들
    toggleSelectAll() {
        const selectAllCheckbox = document.getElementById('select-all-submissions');
        const submissionCheckboxes = document.querySelectorAll('.submission-checkbox');
        
        submissionCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
        
        this.updateSelectionCount();
    }
    
    updateSelectionCount() {
        const selectedCheckboxes = document.querySelectorAll('.submission-checkbox:checked');
        const count = selectedCheckboxes.length;
        const totalCheckboxes = document.querySelectorAll('.submission-checkbox');
        
        document.getElementById('selected-count').textContent = `${count}개 선택됨`;
        
        // 버튼 활성화/비활성화
        const downloadSelectedBtn = document.getElementById('download-selected-btn');
        const deleteSelectedBtn = document.getElementById('delete-selected-btn');
        
        if (downloadSelectedBtn && deleteSelectedBtn) {
            downloadSelectedBtn.disabled = count === 0;
            deleteSelectedBtn.disabled = count === 0;
        }
        
        // 전체 선택 체크박스 상태 업데이트
        const selectAllCheckbox = document.getElementById('select-all-submissions');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = count === totalCheckboxes.length && count > 0;
            selectAllCheckbox.indeterminate = count > 0 && count < totalCheckboxes.length;
        }
    }
    
    async deleteSelected() {
        const selectedCheckboxes = document.querySelectorAll('.submission-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('삭제할 제출을 선택해주세요.');
            return;
        }
        
        if (!confirm(`선택한 ${selectedIds.length}개의 제출을 삭제하시겠습니까?`)) {
            return;
        }
        
        try {
            let successCount = 0;
            let errorCount = 0;
            
            // 각 제출을 개별적으로 삭제
            for (const submissionId of selectedIds) {
                try {
                    const response = await fetch(`/api/teacher/submissions/${submissionId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                    
                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                }
            }
            
            if (successCount > 0) {
                this.showNotification('success', `${successCount}개의 제출이 삭제되었습니다.`);
                // 현재 세션의 제출 목록 새로고침
                if (this.currentSessionId) {
                    this.loadSessionSubmissions(this.currentSessionId);
                }
            }
            
            if (errorCount > 0) {
                this.showNotification('error', `${errorCount}개의 제출 삭제에 실패했습니다.`);
            }
            
        } catch (error) {
            this.showNotification('error', '삭제 중 오류가 발생했습니다.');
        }
    }
    
    async deleteAll() {
        if (!this.currentSessionId) {
            alert('활성 세션을 선택해주세요.');
            return;
        }
        
        if (!confirm('이 세션의 모든 제출을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/sessions/${this.currentSessionId}/submissions`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                alert('모든 제출이 삭제되었습니다.');
                this.loadSessionSubmissions(this.currentSessionId);
            } else {
                const data = await response.json();
                alert(`삭제 실패: ${data.error}`);
            }
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        }
    }
    
    async downloadSelected() {
        const selectedCheckboxes = document.querySelectorAll('.submission-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => cb.value);
        
        if (selectedIds.length === 0) {
            alert('다운로드할 제출을 선택해주세요.');
            return;
        }
        
        try {
            const response = await fetch('/api/teacher/submissions/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ submissionIds: selectedIds })
            });
            
            if (response.ok) {
                const data = await response.json();
                this.downloadExcel(data.submissions, `selected_submissions_${new Date().toISOString().slice(0, 10)}`);
            } else {
                const errorData = await response.json();
                alert(`다운로드 실패: ${errorData.error}`);
            }
        } catch (error) {
            alert('다운로드 중 오류가 발생했습니다.');
        }
    }
    
    async downloadAll() {
        if (!this.currentSessionId) {
            alert('활성 세션을 선택해주세요.');
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/sessions/${this.currentSessionId}/submissions/download`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.downloadExcel(data.submissions, `session_${this.currentSessionId}_submissions_${new Date().toISOString().slice(0, 10)}`);
            } else {
                const errorData = await response.json();
                alert(`다운로드 실패: ${errorData.error}`);
            }
        } catch (error) {
            alert('다운로드 중 오류가 발생했습니다.');
        }
    }

    // 엑셀 다운로드 함수
    downloadExcel(submissions, filename) {
        // SheetJS 라이브러리를 동적으로 로드
        if (typeof XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                this.generateExcelFile(submissions, filename);
            };
            document.head.appendChild(script);
        } else {
            this.generateExcelFile(submissions, filename);
        }
    }
    
    generateExcelFile(submissions, filename) {
        // 엑셀 데이터 준비
        const worksheetData = [
            ['제출ID', '학생이름', '학생ID', '문제제목', '세션제목', '클래스', '제출시간', '상태', '실행시간(ms)', '코드', '출력', '오류메시지']
        ];
        
        submissions.forEach(sub => {
            worksheetData.push([
                sub.id || '',
                sub.student_name || '',
                sub.student_username || '',
                sub.problem_title || '',
                sub.session_title || '',
                sub.class_id || '',
                this.formatKoreanTime(sub.submitted_at, true),
                sub.status || '',
                sub.execution_time || '',
                sub.code || '',
                sub.output || '',
                sub.error_message || ''
            ]);
        });
        
        // 워크시트 생성
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // 컬럼 너비 설정
        worksheet['!cols'] = [
            { wch: 8 },   // 제출ID
            { wch: 12 },  // 학생이름
            { wch: 12 },  // 학생ID
            { wch: 20 },  // 문제제목
            { wch: 20 },  // 세션제목
            { wch: 10 },  // 클래스
            { wch: 18 },  // 제출시간
            { wch: 8 },   // 상태
            { wch: 12 },  // 실행시간
            { wch: 50 },  // 코드
            { wch: 30 },  // 출력
            { wch: 30 }   // 오류메시지
        ];
        
        // 워크북 생성
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '제출현황');
        
        // 파일 다운로드
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    }

    logout() {
        this.stopPolling();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
    
    // 삭제 요청 관리 화면
    async showDeletionRequests() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <div>
                        <h2 class="text-xl md:text-2xl font-bold text-white mb-2">
                            <i class="fas fa-trash-restore mr-2 text-yellow-400"></i>제출 기록 삭제 요청 관리
                        </h2>
                        <p class="text-gray-400 text-sm">학생들이 요청한 제출 기록 삭제를 승인하거나 거부할 수 있습니다.</p>
                    </div>
                    <button onclick="teacherDashboard.refreshDeletionRequests()" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors duration-200">
                        <i class="fas fa-sync-alt mr-2"></i>새로고침
                    </button>
                </div>
                
                <div id="deletion-requests-content">
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p class="text-gray-400 mt-2">삭제 요청을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadDeletionRequests();
    }
    
    async loadDeletionRequests() {
        try {
            const response = await fetch('/api/teacher/deletion-requests', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderDeletionRequests(data.requests);
                this.updatePendingRequestsBadge(data.requests.filter(req => req.status === 'pending').length);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('deletion-requests-content').innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                    <p class="text-red-400 mt-2">삭제 요청을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderDeletionRequests(requests) {
        const contentDiv = document.getElementById('deletion-requests-content');
        
        if (requests.length === 0) {
            contentDiv.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
                    <h3 class="text-lg font-semibold text-white mb-2">삭제 요청이 없습니다</h3>
                    <p class="text-gray-400">현재 처리할 삭제 요청이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        const pendingRequests = requests.filter(req => req.status === 'pending');
        const processedRequests = requests.filter(req => req.status !== 'pending');
        
        contentDiv.innerHTML = `
            <!-- 대기 중인 요청 -->
            ${pendingRequests.length > 0 ? `
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                        <i class="fas fa-clock mr-2 text-yellow-400"></i>
                        승인 대기 중 (${pendingRequests.length}개)
                    </h3>
                    <div class="space-y-4">
                        ${pendingRequests.map(req => this.renderDeletionRequestCard(req, true)).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- 처리된 요청 -->
            ${processedRequests.length > 0 ? `
                <div>
                    <h3 class="text-lg font-semibold text-white mb-4 flex items-center">
                        <i class="fas fa-history mr-2 text-gray-400"></i>
                        처리된 요청 (${processedRequests.length}개)
                    </h3>
                    <div class="space-y-4 max-h-96 overflow-y-auto">
                        ${processedRequests.map(req => this.renderDeletionRequestCard(req, false)).join('')}
                    </div>
                </div>
            ` : ''}
        `;
    }
    
    renderDeletionRequestCard(request, isPending) {
        const statusColors = {
            'pending': 'bg-yellow-900 border-yellow-700 text-yellow-300',
            'approved': 'bg-green-900 border-green-700 text-green-300',
            'rejected': 'bg-red-900 border-red-700 text-red-300'
        };
        
        const statusIcons = {
            'pending': 'fa-clock',
            'approved': 'fa-check-circle',
            'rejected': 'fa-times-circle'
        };
        
        const statusTexts = {
            'pending': '승인 대기',
            'approved': '승인됨',
            'rejected': '거부됨'
        };
        
        return `
            <div class="bg-gray-700 rounded-lg p-4 border ${isPending ? 'border-yellow-500' : 'border-gray-600'}">
                <div class="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-white font-semibold">${request.session_title}</h4>
                            <span class="px-2 py-1 ${statusColors[request.status]} text-xs rounded border">
                                <i class="fas ${statusIcons[request.status]} mr-1"></i>
                                ${statusTexts[request.status]}
                            </span>
                        </div>
                        
                        <div class="space-y-2 text-sm">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-300">
                                <p><strong>문제:</strong> ${request.problem_title}</p>
                                <p><strong>학생:</strong> ${request.student_name} (@${request.student_username})</p>
                                <p><strong>제출 시간:</strong> ${this.formatKoreanTime(request.submitted_at, true)}</p>
                                <p><strong>요청 시간:</strong> ${this.formatKoreanTime(request.request_date, true)}</p>
                            </div>
                            
                            ${request.reason ? `
                                <div class="mt-3 p-3 bg-gray-800 rounded border border-gray-600">
                                    <p class="text-gray-400 text-xs mb-1">삭제 사유:</p>
                                    <p class="text-gray-200">${request.reason}</p>
                                </div>
                            ` : ''}
                            
                            ${request.code ? `
                                <div class="mt-3">
                                    <p class="text-gray-400 text-xs mb-2">제출된 코드:</p>
                                    <pre class="bg-gray-900 p-3 rounded text-green-300 text-xs overflow-x-auto max-h-32">${request.code}</pre>
                                </div>
                            ` : ''}
                            
                            ${request.output ? `
                                <div class="mt-3">
                                    <p class="text-gray-400 text-xs mb-2">출력 결과:</p>
                                    <pre class="bg-gray-900 p-3 rounded text-white text-xs overflow-x-auto max-h-24">${request.output}</pre>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="flex-shrink-0">
                        ${isPending ? `
                            <div class="flex flex-col gap-2">
                                <button onclick="teacherDashboard.showResponseModal(${request.id}, 'approve', '${request.student_name}', '${request.problem_title}')" 
                                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors duration-200 w-full">
                                    <i class="fas fa-check mr-1"></i>승인
                                </button>
                                <button onclick="teacherDashboard.showResponseModal(${request.id}, 'reject', '${request.student_name}', '${request.problem_title}')" 
                                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors duration-200 w-full">
                                    <i class="fas fa-times mr-1"></i>거부
                                </button>
                            </div>
                        ` : `
                            <div class="text-xs text-gray-400 text-right">
                                ${request.teacher_name ? `<p>처리자: ${request.teacher_name}</p>` : ''}
                                ${request.response_date ? `<p>${new Date(request.response_date).toLocaleString('ko-KR')}</p>` : ''}
                                ${request.teacher_response ? `<p class="mt-2 italic">"${request.teacher_response}"</p>` : ''}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    showResponseModal(requestId, action, studentName, problemTitle) {
        const isApprove = action === 'approve';
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas ${isApprove ? 'fa-check-circle text-green-400' : 'fa-times-circle text-red-400'} text-xl mr-3"></i>
                        <h3 class="text-lg font-bold text-white">삭제 요청 ${isApprove ? '승인' : '거부'}</h3>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-gray-300 text-sm mb-2">다음 삭제 요청을 ${isApprove ? '승인' : '거부'}하시겠습니까?</p>
                        <div class="bg-gray-700 p-3 rounded border border-gray-600">
                            <p class="text-white font-medium">${problemTitle}</p>
                            <p class="text-gray-400 text-xs">요청자: ${studentName}</p>
                        </div>
                    </div>
                    
                    ${isApprove ? `
                        <div class="bg-red-900 border border-red-700 p-3 rounded mb-4">
                            <div class="flex items-start">
                                <i class="fas fa-exclamation-triangle text-red-400 mr-2 mt-0.5 text-sm"></i>
                                <div class="text-red-200 text-xs">
                                    <p class="font-semibold mb-1">주의사항:</p>
                                    <p>승인하면 제출 기록이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-300 mb-2">${isApprove ? '승인' : '거부'} 메시지 (선택사항)</label>
                        <textarea id="response-message" 
                                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-${isApprove ? 'green' : 'red'}-500 text-white text-sm resize-none"
                                  rows="3"
                                  placeholder="${isApprove ? '승인 사유를 입력하세요 (예: 정당한 요청으로 판단됩니다)' : '거부 사유를 입력하세요 (예: 충분한 사유가 없습니다)'}"></textarea>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200">
                            취소
                        </button>
                        <button onclick="teacherDashboard.processResponse(${requestId}, '${action}')" 
                                class="w-full sm:w-auto px-4 py-2 bg-${isApprove ? 'green' : 'red'}-600 hover:bg-${isApprove ? 'green' : 'red'}-700 text-white rounded-md transition-colors duration-200">
                            ${isApprove ? '승인' : '거부'} 확정
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async processResponse(requestId, action) {
        const responseMessage = document.getElementById('response-message').value;
        const modal = document.querySelector('.fixed');
        
        try {
            const response = await fetch(`/api/teacher/deletion-requests/${requestId}/response`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    action,
                    response: responseMessage
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 성공 알림
                this.showNotification('success', data.message);
                
                // 삭제 요청 목록 새로고침
                await this.refreshDeletionRequests();
            } else {
                this.showNotification('error', data.error);
            }
        } catch (error) {
            console.error('Process response error:', error);
            this.showNotification('error', '서버 연결에 실패했습니다.');
        }
        
        // 모달 닫기
        if (modal) {
            modal.remove();
        }
    }
    
    async refreshDeletionRequests() {
        await this.loadDeletionRequests();
    }
    
    updatePendingRequestsBadge(count) {
        const badge = document.getElementById('pending-requests-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }
    
    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border max-w-sm ${
            type === 'success' 
                ? 'bg-green-900 border-green-700 text-green-200' 
                : 'bg-red-900 border-red-700 text-red-200'
        }`;
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2"></i>
                <p class="text-sm">${message}</p>
                <button onclick="this.closest('div').remove()" class="ml-4 text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.remove();
            }
        }, 5000);
    }

    showAccountSettings() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">계정 설정</h2>
                
                <!-- 계정 정보 -->
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-white mb-4">계정 정보</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">아이디</label>
                            <input type="text" value="${this.user.username}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400" readonly>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">이름</label>
                            <input type="text" value="${this.user.full_name}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400" readonly>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">역할</label>
                            <input type="text" value="교사" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400" readonly>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">이메일</label>
                            <input type="text" value="${this.user.email || '미등록'}" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-400" readonly>
                        </div>
                    </div>
                </div>

                <!-- 비밀번호 변경 -->
                <div class="border-t border-gray-600 pt-6">
                    <h3 class="text-lg font-semibold text-white mb-4">비밀번호 변경</h3>
                    <form id="teacher-change-password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">현재 비밀번호</label>
                            <input type="password" id="teacher-current-password" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">새 비밀번호 (최소 4자)</label>
                            <input type="password" id="teacher-new-password" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" minlength="4" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">새 비밀번호 확인</label>
                            <input type="password" id="teacher-confirm-password" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white" minlength="4" required>
                        </div>
                        
                        <!-- 비밀번호 강도 표시 -->
                        <div id="teacher-password-strength" class="hidden">
                            <div class="flex items-center justify-between text-xs">
                                <span class="text-gray-400">비밀번호 강도:</span>
                                <span id="teacher-strength-text" class="font-medium"></span>
                            </div>
                            <div class="w-full bg-gray-600 rounded-full h-1 mt-1">
                                <div id="teacher-strength-bar" class="h-1 rounded-full transition-all duration-300"></div>
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200">
                                비밀번호 변경
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        this.setupTeacherPasswordChangeForm();
    }
    
    setupTeacherPasswordChangeForm() {
        const form = document.getElementById('teacher-change-password-form');
        const newPasswordInput = document.getElementById('teacher-new-password');
        const confirmPasswordInput = document.getElementById('teacher-confirm-password');
        
        if (!form) return;
        
        // 비밀번호 강도 검사
        newPasswordInput.addEventListener('input', () => {
            this.checkTeacherPasswordStrength(newPasswordInput.value);
        });
        
        // 비밀번호 확인 검사
        confirmPasswordInput.addEventListener('input', () => {
            this.checkTeacherPasswordMatch();
        });
        
        // 폼 제출 처리
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.changeTeacherPassword();
        });
    }
    
    checkTeacherPasswordStrength(password) {
        const strengthDiv = document.getElementById('teacher-password-strength');
        const strengthBar = document.getElementById('teacher-strength-bar');
        const strengthText = document.getElementById('teacher-strength-text');
        
        if (password.length === 0) {
            strengthDiv.classList.add('hidden');
            return;
        }
        
        strengthDiv.classList.remove('hidden');
        
        let strength = 0;
        let text = '';
        let color = '';
        
        if (password.length >= 4) strength += 1;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        switch (strength) {
            case 0:
            case 1:
                text = '약함';
                color = 'bg-red-500';
                break;
            case 2:
            case 3:
                text = '보통';
                color = 'bg-yellow-500';
                break;
            case 4:
            case 5:
                text = '강함';
                color = 'bg-green-500';
                break;
        }
        
        strengthText.textContent = text;
        strengthText.className = `font-medium text-${color.split('-')[1]}-400`;
        strengthBar.className = `h-1 rounded-full transition-all duration-300 ${color}`;
        strengthBar.style.width = `${(strength / 5) * 100}%`;
    }
    
    checkTeacherPasswordMatch() {
        const newPassword = document.getElementById('teacher-new-password').value;
        const confirmPassword = document.getElementById('teacher-confirm-password').value;
        const confirmInput = document.getElementById('teacher-confirm-password');
        
        if (confirmPassword.length === 0) {
            confirmInput.classList.remove('border-red-500', 'border-green-500');
            return;
        }
        
        if (newPassword === confirmPassword) {
            confirmInput.classList.remove('border-red-500');
            confirmInput.classList.add('border-green-500');
        } else {
            confirmInput.classList.remove('border-green-500');
            confirmInput.classList.add('border-red-500');
        }
    }
    
    async changeTeacherPassword() {
        const currentPassword = document.getElementById('teacher-current-password').value;
        const newPassword = document.getElementById('teacher-new-password').value;
        const confirmPassword = document.getElementById('teacher-confirm-password').value;
        
        // 유효성 검사
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showNotification('error', '모든 필드를 입력해주세요.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showNotification('error', '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        if (newPassword.length < 4) {
            this.showNotification('error', '새 비밀번호는 최소 4자 이상이어야 합니다.');
            return;
        }
        
        try {
            const response = await fetch('/api/teacher/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message);
                // 폼 초기화
                document.getElementById('teacher-change-password-form').reset();
                document.getElementById('teacher-password-strength').classList.add('hidden');
                document.getElementById('teacher-confirm-password').classList.remove('border-red-500', 'border-green-500');
            } else {
                this.showNotification('error', data.error);
            }
        } catch (error) {
            console.error('Change password error:', error);
            this.showNotification('error', '서버 연결에 실패했습니다.');
        }
    }
    
    // 문제 편집 화면 표시
    async showEditProblemForm(problemId) {
        try {
            // 기존 문제 정보 가져오기
            const response = await fetch(`/api/teacher/problems/${problemId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error);
            }
            
            const problem = data.problem;
            
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-white">문제 편집</h2>
                        <button onclick="teacherDashboard.showProblemManagement()" 
                                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                            <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                        </button>
                    </div>
                    
                    <form id="edit-problem-form" class="space-y-6">
                        <input type="hidden" name="problem_id" value="${problem.id}">
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">문제 제목</label>
                            <input type="text" name="title" value="${problem.title}" required 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                   placeholder="예: 변수와 출력">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">문제 설명</label>
                            <textarea name="description" required rows="4"
                                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                                      placeholder="문제에 대한 자세한 설명을 입력하세요...">${problem.description}</textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">초기 코드 (선택사항)</label>
                                <textarea name="initial_code" rows="4"
                                          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono"
                                          placeholder="# 학생에게 제공할 초기 코드&#10;print('Hello, World!')">${problem.initial_code || ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">예상 출력 (선택사항)</label>
                                <textarea name="expected_output" rows="4"
                                          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono"
                                          placeholder="예상되는 출력 결과">${problem.expected_output || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">제한 시간 (초)</label>
                                <input type="number" name="time_limit" value="${problem.time_limit}" min="10" max="300"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">메모리 제한 (MB)</label>
                                <input type="number" name="memory_limit" value="${problem.memory_limit}" min="64" max="512"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">난이도</label>
                                <select name="difficulty" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                                    <option value="easy" ${problem.difficulty === 'easy' ? 'selected' : ''}>쉬움</option>
                                    <option value="medium" ${problem.difficulty === 'medium' ? 'selected' : ''}>보통</option>
                                    <option value="hard" ${problem.difficulty === 'hard' ? 'selected' : ''}>어려움</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="flex space-x-4">
                            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded">
                                <i class="fas fa-save mr-2"></i>수정 저장
                            </button>
                            <button type="button" onclick="teacherDashboard.showProblemManagement()" 
                                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded">
                                <i class="fas fa-times mr-2"></i>취소
                            </button>
                        </div>
                    </form>
                    
                    <div id="edit-problem-result" class="mt-4 hidden"></div>
                </div>
            `;
            
            document.getElementById('edit-problem-form').addEventListener('submit', this.handleEditProblem.bind(this));
            
        } catch (error) {
            this.showNotification('error', '문제 정보를 불러오는데 실패했습니다.');
        }
    }
    
    // 문제 편집 처리
    async handleEditProblem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const problemData = Object.fromEntries(formData.entries());
        const problemId = problemData.problem_id;
        
        // problem_id는 API 요청에서 제외
        delete problemData.problem_id;
        
        // 테스트 케이스는 간단히 빈 배열로 설정
        problemData.test_cases = [];
        
        try {
            const response = await fetch(`/api/teacher/problems/${problemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(problemData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('edit-problem-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>문제가 성공적으로 수정되었습니다.
                    </div>
                `;
                setTimeout(() => this.showProblemManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('edit-problem-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>문제 수정 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    // 문제 삭제
    async deleteProblem(problemId, problemTitle) {
        if (!confirm(`정말로 "${problemTitle}" 문제를 삭제하시겠습니까?\n\n주의: 이 문제와 관련된 모든 세션과 제출 기록도 함께 삭제됩니다.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/problems/${problemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.showNotification('success', '문제가 성공적으로 삭제되었습니다.');
                this.loadProblems(); // 문제 목록 새로고침
            } else {
                const data = await response.json();
                this.showNotification('error', `삭제 실패: ${data.error}`);
            }
        } catch (error) {
            this.showNotification('error', '문제 삭제 중 오류가 발생했습니다.');
        }
    }

    // 클래스 관리 화면
    async showClassManagement() {
        this.stopPolling();
        
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h1 class="text-2xl font-bold text-gray-800">클래스 관리</h1>
                    <button onclick="teacherDashboard.showCreateClassForm()" 
                            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white shadow-lg transition-all hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>클래스 생성
                    </button>
                </div>
                
                <div id="classes-container" class="space-y-4">
                    <div class="text-center py-8">
                        <div class="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                        <p class="text-gray-600 mt-2">클래스 목록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadClasses();
    }
    
    async loadClasses() {
        try {
            const response = await fetch('/api/teacher/classes', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderClassesList(data.classes);
            } else {
                document.getElementById('classes-container').innerHTML = `
                    <div class="text-center py-8">
                        <p class="text-red-400">${data.error}</p>
                    </div>
                `;
            }
        } catch (error) {
            document.getElementById('classes-container').innerHTML = `
                <div class="text-center py-8">
                    <p class="text-red-400">클래스 목록 로드 중 오류가 발생했습니다.</p>
                </div>
            `;
        }
    }
    
    renderClassesList(classes) {
        const container = document.getElementById('classes-container');
        
        if (!classes || classes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-lg">
                    <i class="fas fa-users text-4xl text-emerald-400 mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-800 mb-2">클래스가 없습니다</h3>
                    <p class="text-gray-600 mb-4">첫 번째 클래스를 생성해보세요.</p>
                    <button onclick="teacherDashboard.showCreateClassForm()" 
                            class="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white shadow-lg transition-all hover:shadow-xl">
                        <i class="fas fa-plus mr-2"></i>클래스 생성
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = classes.map(cls => `
            <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-800 mb-2">${cls.name}</h3>
                        <p class="text-gray-600 text-sm mb-1">클래스 ID: <code class="bg-gray-100 px-2 py-1 rounded text-emerald-600 font-mono">${cls.id}</code></p>
                        <p class="text-gray-600 text-sm mb-3">${cls.description || '설명 없음'}</p>
                        <div class="flex items-center text-sm text-gray-500">
                            <i class="fas fa-users mr-2 text-emerald-500"></i>
                            <span>${cls.student_count}명</span>
                            <i class="fas fa-calendar-alt ml-4 mr-2 text-emerald-500"></i>
                            <span>${this.formatKoreanTime(cls.created_at)}</span>
                        </div>
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="teacherDashboard.showClassMembers('${cls.id}')" 
                                class="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-users mr-1"></i>멤버
                        </button>
                        <button onclick="teacherDashboard.showEditClassForm('${cls.id}')" 
                                class="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-edit mr-1"></i>편집
                        </button>
                        <button onclick="teacherDashboard.deleteClass('${cls.id}', '${cls.name}')" 
                                class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-trash mr-1"></i>삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    showCreateClassForm() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
                <h3 class="text-xl font-bold mb-4 text-gray-800">클래스 생성</h3>
                
                <form id="create-class-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">클래스 ID *</label>
                        <input type="text" id="class-id" required
                               placeholder="예: python2024, grade1a"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                        <p class="text-xs text-gray-500 mt-1">영문, 숫자, 한글, 특수문자 사용 가능</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">클래스 이름 *</label>
                        <input type="text" id="class-name" required
                               placeholder="예: 파이썬 초급반"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                        <textarea id="class-description" rows="3"
                                  placeholder="클래스에 대한 설명을 입력하세요"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                    </div>
                    
                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors">취소</button>
                        <button type="submit" 
                                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                            <i class="fas fa-plus mr-2"></i>생성
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('create-class-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createClass();
        });
        
        setTimeout(() => document.getElementById('class-id').focus(), 100);
    }
    
    async createClass() {
        const id = document.getElementById('class-id').value.trim();
        const name = document.getElementById('class-name').value.trim();
        const description = document.getElementById('class-description').value.trim();
        
        if (!id || !name) {
            alert('클래스 ID와 이름은 필수입니다.');
            return;
        }
        
        try {
            const response = await fetch('/api/teacher/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ id, name, description })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', '클래스가 생성되었습니다.');
                document.querySelector('.fixed').remove();
                this.loadClasses();
            } else {
                alert(`클래스 생성 실패: ${data.error}`);
            }
        } catch (error) {
            alert('클래스 생성 중 오류가 발생했습니다.');
        }
    }
    
    async deleteClass(classId, className) {
        if (!confirm(`정말로 클래스 "${className}"를 삭제하시겠습니까?\n\n모든 클래스 멤버도 함께 제거됩니다.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.showNotification('success', '클래스가 삭제되었습니다.');
                this.loadClasses();
            } else {
                const data = await response.json();
                this.showNotification('error', `삭제 실패: ${data.error}`);
            }
        } catch (error) {
            this.showNotification('error', '클래스 삭제 중 오류가 발생했습니다.');
        }
    }
    
    async showClassMembers(classId) {
        try {
            const response = await fetch(`/api/teacher/classes/${classId}/members`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderClassMembersModal(classId, data.class, data.members);
            } else {
                alert(`클래스 멤버 조회 실패: ${data.error}`);
            }
        } catch (error) {
            alert('클래스 멤버 조회 중 오류가 발생했습니다.');
        }
    }
    
    renderClassMembersModal(classId, classInfo, members) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${classInfo.name} - 클래스 멤버</h3>
                    <div class="flex gap-2">
                        <button onclick="teacherDashboard.showAddStudentModal('${classId}')" 
                                class="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded text-white text-sm transition-colors">
                            <i class="fas fa-user-plus mr-1"></i>학생 추가
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-xl transition-colors">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-3">
                    ${members.length === 0 ? `
                        <div class="text-center py-8">
                            <i class="fas fa-users text-4xl text-emerald-400 mb-4"></i>
                            <p class="text-gray-600">클래스에 학생이 없습니다.</p>
                        </div>
                    ` : members.map(member => `
                        <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <h4 class="font-medium text-gray-800">${member.full_name}</h4>
                                <p class="text-sm text-gray-600">ID: ${member.username}</p>
                                <p class="text-xs text-gray-500">가입일: ${this.formatKoreanTime(member.joined_at)}</p>
                            </div>
                            <button onclick="teacherDashboard.removeStudentFromClass('${classId}', ${member.id}, '${member.full_name}')" 
                                    class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-user-minus mr-1"></i>제거
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async showAddStudentModal(classId) {
        // 전체 학생 목록 로드
        try {
            const response = await fetch('/api/teacher/students', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderAddStudentModal(classId, data.students);
            } else {
                alert(`학생 목록 조회 실패: ${data.error}`);
            }
        } catch (error) {
            alert('학생 목록 조회 중 오류가 발생했습니다.');
        }
    }
    
    renderAddStudentModal(classId, students) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-gray-700 max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-white">학생 추가</h3>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="text-gray-400 hover:text-white text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <input type="text" id="student-search" placeholder="학생 이름이나 ID로 검색..."
                           class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                </div>
                
                <form id="add-students-form">
                    <div class="space-y-2 max-h-60 overflow-y-auto mb-4" id="students-list">
                        ${students.map(student => `
                            <label class="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                                <input type="checkbox" value="${student.id}" class="mr-3">
                                <div>
                                    <div class="font-medium text-white">${student.full_name}</div>
                                    <div class="text-sm text-gray-400">ID: ${student.username}</div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div class="flex justify-end gap-3">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">취소</button>
                        <button type="submit" 
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                            <i class="fas fa-user-plus mr-2"></i>선택한 학생 추가
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 검색 기능
        document.getElementById('student-search').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const studentLabels = document.querySelectorAll('#students-list label');
            
            studentLabels.forEach(label => {
                const text = label.textContent.toLowerCase();
                label.style.display = text.includes(searchTerm) ? 'flex' : 'none';
            });
        });
        
        // 폼 제출
        document.getElementById('add-students-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addStudentsToClass(classId);
        });
    }
    
    async addStudentsToClass(classId) {
        const selectedStudents = Array.from(document.querySelectorAll('#students-list input[type="checkbox"]:checked'))
            .map(cb => parseInt(cb.value));
        
        if (selectedStudents.length === 0) {
            alert('추가할 학생을 선택해주세요.');
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/classes/${classId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ studentIds: selectedStudents })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', data.message);
                document.querySelector('.fixed').remove(); // 학생 추가 모달 닫기
                // 클래스 멤버 모달이 있다면 새로고침
                const memberModal = document.querySelector('.fixed');
                if (memberModal) {
                    memberModal.remove();
                    this.showClassMembers(classId);
                }
                this.loadClasses(); // 클래스 목록 새로고침
            } else {
                alert(`학생 추가 실패: ${data.error}`);
            }
        } catch (error) {
            alert('학생 추가 중 오류가 발생했습니다.');
        }
    }
    
    async removeStudentFromClass(classId, studentId, studentName) {
        if (!confirm(`정말로 "${studentName}" 학생을 클래스에서 제거하시겠습니까?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/classes/${classId}/members/${studentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.showNotification('success', '학생이 클래스에서 제거되었습니다.');
                // 멤버 모달 새로고침
                const memberModal = document.querySelector('.fixed');
                if (memberModal) {
                    memberModal.remove();
                    this.showClassMembers(classId);
                }
                this.loadClasses();
            } else {
                const data = await response.json();
                this.showNotification('error', `제거 실패: ${data.error}`);
            }
        } catch (error) {
            this.showNotification('error', '학생 제거 중 오류가 발생했습니다.');
        }
    }
    
    // 클래스 편집 기능
    async showEditClassForm(classId) {
        try {
            // 클래스 정보 먼저 로드
            const response = await fetch(`/api/teacher/classes/${classId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                alert(`클래스 정보 로드 실패: ${data.error}`);
                return;
            }
            
            const classInfo = data.class;
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
            modal.innerHTML = `
                <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
                    <h3 class="text-xl font-bold mb-4 text-gray-800">클래스 편집</h3>
                    
                    <form id="edit-class-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">클래스 ID</label>
                            <input type="text" id="edit-class-id" value="${classInfo.id}" disabled
                                   class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed">
                            <p class="text-xs text-gray-500 mt-1">클래스 ID는 수정할 수 없습니다</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">클래스 이름 *</label>
                            <input type="text" id="edit-class-name" value="${classInfo.name}" required
                                   placeholder="예: 파이썬 초급반"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">설명</label>
                            <textarea id="edit-class-description" rows="3"
                                      placeholder="클래스에 대한 설명을 입력하세요"
                                      class="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">${classInfo.description || ''}</textarea>
                        </div>
                        
                        <div class="flex justify-end gap-3 pt-4">
                            <button type="button" onclick="this.closest('.fixed').remove()" 
                                    class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors">취소</button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                                <i class="fas fa-save mr-2"></i>저장
                            </button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('edit-class-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateClass(classId);
            });
            
            setTimeout(() => document.getElementById('edit-class-name').focus(), 100);
            
        } catch (error) {
            alert('클래스 정보 로드 중 오류가 발생했습니다.');
        }
    }
    
    async updateClass(classId) {
        const name = document.getElementById('edit-class-name').value.trim();
        const description = document.getElementById('edit-class-description').value.trim();
        
        if (!name) {
            alert('클래스 이름은 필수입니다.');
            return;
        }
        
        try {
            const response = await fetch(`/api/teacher/classes/${classId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ name, description })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showNotification('success', '클래스가 수정되었습니다.');
                document.querySelector('.fixed').remove();
                this.loadClasses();
            } else {
                alert(`클래스 수정 실패: ${data.error}`);
            }
        } catch (error) {
            alert('클래스 수정 중 오류가 발생했습니다.');
        }
    }
    
    // 프로필 편집 모달
    showProfileEditModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
                <h3 class="text-xl font-bold mb-4 text-gray-800">프로필 편집</h3>
                
                <form id="profile-edit-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                        <input type="text" id="profile-name" value="${this.user.full_name}" required
                               placeholder="이름을 입력하세요"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>
                        <input type="email" id="profile-email" value="${this.user.email || ''}" required
                               placeholder="이메일을 입력하세요"
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">사용자 ID</label>
                        <input type="text" value="${this.user.username}" disabled
                               class="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed">
                        <p class="text-xs text-gray-500 mt-1">사용자 ID는 변경할 수 없습니다</p>
                    </div>
                    
                    <div class="flex justify-end gap-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors">취소</button>
                        <button type="submit" 
                                class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('profile-edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        setTimeout(() => document.getElementById('profile-name').focus(), 100);
    }
    
    async updateProfile() {
        const name = document.getElementById('profile-name').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        
        if (!name || !email) {
            alert('이름과 이메일은 필수입니다.');
            return;
        }
        
        try {
            const response = await fetch('/api/teacher/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ full_name: name, email: email })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 로컬 사용자 정보 업데이트
                this.user.full_name = name;
                this.user.email = email;
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // 네비게이션 다시 렌더링
                this.renderNavigation();
                
                this.showNotification('success', '프로필이 업데이트되었습니다.');
                document.querySelector('.fixed').remove();
            } else {
                alert(`프로필 업데이트 실패: ${data.error}`);
            }
        } catch (error) {
            alert('프로필 업데이트 중 오류가 발생했습니다.');
        }
    }
}

// 페이지 로드 시 초기화
let teacherDashboard;
document.addEventListener('DOMContentLoaded', () => {
    teacherDashboard = new TeacherDashboard();
});