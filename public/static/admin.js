// 관리자 대시보드 JavaScript

class AdminDashboard {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!this.token || this.user.role !== 'admin') {
            window.location.href = '/';
            return;
        }
        
        this.init();
    }
    
    init() {
        this.renderHeader();
        this.renderNavigation();
        this.showUserManagement();
    }
    
    // 한국 시간으로 포맷팅하는 공통 함수
    formatKoreanDate(dateString) {
        if (!dateString) return '-';
        
        const date = new Date(dateString);
        
        // UTC 시간에 9시간(KST 오프셋) 추가
        const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        
        const year = koreanTime.getUTCFullYear();
        const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
        const day = String(koreanTime.getUTCDate()).padStart(2, '0');
        
        return `${year}.${month}.${day}`;
    }
    
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
    
    renderHeader() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <!-- 모바일 메뉴 토글 버튼 -->
            <button id="mobile-menu-toggle" class="md:hidden fixed top-4 left-4 z-50 bg-white hover:bg-gray-100 p-2 rounded-lg shadow-lg">
                <i class="fas fa-bars text-gray-700"></i>
            </button>
            
            <!-- 모바일 오버레이 -->
            <div id="mobile-overlay" class="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 hidden"></div>
            
            <header class="gradient-header shadow-lg sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <div class="md:hidden w-8"></div> <!-- 모바일 메뉴 버튼 공간 확보 -->
                            <i class="fas fa-user-shield text-xl md:text-2xl text-yellow-300 mr-2 md:mr-3"></i>
                            <h1 class="text-lg md:text-xl font-bold text-white">EunPyeong Python Education</h1>
                            <span class="ml-3 text-sm text-yellow-200">관리자</span>
                        </div>
                        <div class="flex items-center space-x-2 md:space-x-4">
                            <span class="text-gray-100 text-sm md:text-base hidden sm:inline">${this.user.full_name}</span>
                            <button onclick="adminDashboard.logout()" class="bg-red-500 hover:bg-red-600 px-2 md:px-4 py-2 rounded text-white text-sm md:text-base transition-colors">
                                <i class="fas fa-sign-out-alt mr-1 md:mr-2"></i><span class="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="flex min-h-screen bg-gray-50">
                <!-- 데스크톱 사이드바 -->
                <nav id="sidebar" class="hidden md:block w-80 bg-white shadow-lg border-r border-gray-200">
                    <!-- 네비게이션 메뉴 -->
                </nav>
                
                <!-- 모바일 사이드바 -->
                <nav id="mobile-sidebar" class="md:hidden fixed left-0 top-0 h-full w-80 bg-white shadow-lg transform -translate-x-full transition-transform duration-300 ease-in-out z-40">
                    <!-- 네비게이션 메뉴 (모바일) -->
                </nav>
                
                <main id="main-content" class="flex-1 p-4 md:p-6 w-full md:w-auto">
                    <!-- 메인 콘텐츠 -->
                </main>
            </div>
        `;
    }
    
    renderNavigation() {
        const navigationHTML = `
            <!-- 프로필 섹션 -->
            <div class="p-6 border-b border-gray-100">
                <div class="flex items-center">
                    <div class="bg-emerald-100 rounded-full p-3 mr-4">
                        <i class="fas fa-user-shield text-emerald-600 text-xl"></i>
                    </div>
                    <div>
                        <div class="font-semibold text-gray-800">${this.user.full_name}</div>
                        <div class="text-sm text-emerald-600">관리자</div>
                    </div>
                </div>
            </div>
            
            <div class="p-4 md:p-6">
                <ul class="space-y-2">
                    <li>
                        <button onclick="adminDashboard.showUserManagement(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-blue-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-users text-blue-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">사용자 관리</div>
                                <div class="text-xs text-gray-500">사용자 계정 관리</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.showClassManagement(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-green-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-school text-green-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">클래스 관리</div>
                                <div class="text-xs text-gray-500">클래스 현황 및 관리</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.showBulkUserCreate(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-purple-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-file-excel text-purple-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">엑셀로 계정 생성</div>
                                <div class="text-xs text-gray-500">일괄 계정 생성</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.showSystemStats(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-orange-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-chart-bar text-orange-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">시스템 통계</div>
                                <div class="text-xs text-gray-500">사용 현황 및 통계</div>
                            </div>
                        </button>
                    </li>
                    <li class="border-t border-gray-200 pt-4 mt-4">
                        <button onclick="adminDashboard.showChangePassword(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-gray-700 rounded-lg transition-all">
                            <div class="bg-gray-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-key text-gray-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">비밀번호 변경</div>
                                <div class="text-xs text-gray-500">계정 보안 설정</div>
                            </div>
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.logout(); adminDashboard.closeMobileMenu();" 
                                class="nav-item w-full text-left flex items-center px-4 py-3 text-red-600 rounded-lg transition-all">
                            <div class="bg-red-100 p-2 rounded-lg mr-3">
                                <i class="fas fa-sign-out-alt text-red-600"></i>
                            </div>
                            <div>
                                <div class="font-medium">로그아웃</div>
                                <div class="text-xs text-red-400">계정에서 나가기</div>
                            </div>
                        </button>
                    </li>
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
            mobileSidebar.innerHTML = `
                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-emerald-600">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-white">EunPyeong Python Education</h2>
                        <button onclick="adminDashboard.closeMobileMenu()" class="text-white hover:text-gray-200 transition-colors">
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
    
    async showUserManagement() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <h2 class="text-xl md:text-2xl font-bold text-white">사용자 관리</h2>
                    <button onclick="adminDashboard.showCreateUserForm()" 
                            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm md:text-base w-full sm:w-auto">
                        <i class="fas fa-plus mr-2"></i>사용자 추가
                    </button>
                </div>
                
                <div id="users-table">
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p class="text-gray-400 mt-2">사용자 목록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadUsers();
    }
    
    async loadUsers() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderUsersTable(data.users);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('users-table').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                    <p class="text-red-400 mt-2">사용자 목록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderUsersTable(users) {
        const usersTable = document.getElementById('users-table');
        
        if (users.length === 0) {
            usersTable.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users text-2xl text-gray-400"></i>
                    <p class="text-gray-400 mt-2">등록된 사용자가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        // 데스크톱 테이블 (md 이상에서 표시)
        usersTable.innerHTML = `
            <!-- 데스크톱 테이블 -->
            <div class="hidden md:block overflow-x-auto">
                <table class="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                    <thead class="bg-gray-600">
                        <tr>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">사용자 ID</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이름</th>
                            <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이메일</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">역할</th>
                            <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">클래스</th>
                            <th class="hidden xl:table-cell px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">가입일</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">작업</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-600">
                        ${users.map(user => `
                            <tr class="hover:bg-gray-600">
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-blue-300 font-mono">#${user.id}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-white">${user.username}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-white">${user.full_name}</td>
                                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.email || '-'}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getRoleBadgeColor(user.role)}">
                                        ${this.getRoleText(user.role)}
                                    </span>
                                </td>
                                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.class_id || '-'}</td>
                                <td class="hidden xl:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">${this.formatKoreanDate(user.created_at)}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div class="flex space-x-2">
                                        <button onclick="adminDashboard.showEditUserForm(${user.id})" 
                                                class="text-blue-400 hover:text-blue-300" title="수정">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="adminDashboard.deleteUser(${user.id})" 
                                                class="text-red-400 hover:text-red-300" title="삭제">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- 모바일 카드 뷰 (md 미만에서 표시) -->
            <div class="md:hidden space-y-4">
                ${users.map(user => `
                    <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-blue-300 font-mono text-sm">#${user.id}</span>
                                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${this.getRoleBadgeColor(user.role)}">
                                        ${this.getRoleText(user.role)}
                                    </span>
                                </div>
                                <h3 class="text-white font-medium text-lg">${user.full_name}</h3>
                                <p class="text-gray-300 text-sm">@${user.username}</p>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="adminDashboard.showEditUserForm(${user.id})" 
                                        class="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded" title="수정">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="adminDashboard.deleteUser(${user.id})" 
                                        class="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded" title="삭제">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="space-y-2 text-sm">
                            ${user.email ? `<div class="flex items-center text-gray-300">
                                <i class="fas fa-envelope mr-2 w-4"></i>
                                <span>${user.email}</span>
                            </div>` : ''}
                            ${user.class_id ? `<div class="flex items-center text-gray-300">
                                <i class="fas fa-graduation-cap mr-2 w-4"></i>
                                <span>클래스: ${user.class_id}</span>
                            </div>` : ''}
                            <div class="flex items-center text-gray-300">
                                <i class="fas fa-calendar mr-2 w-4"></i>
                                <span>가입일: ${this.formatKoreanDate(user.created_at)}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    getRoleBadgeColor(role) {
        switch (role) {
            case 'admin': return 'bg-red-100 text-red-800';
            case 'teacher': return 'bg-blue-100 text-blue-800';
            case 'student': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
    
    getRoleText(role) {
        switch (role) {
            case 'admin': return '관리자';
            case 'teacher': return '교사';
            case 'student': return '학생';
            default: return role;
        }
    }
    
    showCreateUserForm() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">사용자 추가</h2>
                    <button onclick="adminDashboard.showUserManagement()" 
                            class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                        <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                    </button>
                </div>
                
                <form id="create-user-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">사용자 ID</label>
                            <input type="text" name="username" required 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
                            <input type="password" name="password" required 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">이름</label>
                            <input type="text" name="full_name" required 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">이메일</label>
                            <input type="email" name="email" 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">역할</label>
                            <select name="role" required class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                                <option value="">선택하세요</option>
                                <option value="admin">관리자</option>
                                <option value="teacher">교사</option>
                                <option value="student">학생</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">클래스 ID (학생만)</label>
                            <input type="text" name="class_id" 
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                        사용자 생성
                    </button>
                </form>
                
                <div id="create-result" class="mt-4 hidden"></div>
            </div>
        `;
        
        document.getElementById('create-user-form').addEventListener('submit', this.handleCreateUser.bind(this));
    }
    
    async handleCreateUser(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('create-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>사용자가 성공적으로 생성되었습니다.
                    </div>
                `;
                e.target.reset();
                setTimeout(() => this.showUserManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('create-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>사용자 생성 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    showBulkUserCreate() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">엑셀 파일로 계정 생성</h2>
                </div>
                
                <div class="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-md">
                    <h3 class="text-lg font-semibold text-blue-300 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>파일 형식 안내
                    </h3>
                    <p class="text-blue-200 mb-2">CSV 형식의 파일을 업로드해주세요. 첫 번째 줄은 헤더로 다음 컬럼들을 포함해야 합니다:</p>
                    <ul class="text-blue-200 ml-4">
                        <li>• <strong>username</strong>: 사용자 ID (필수)</li>
                        <li>• <strong>password</strong>: 비밀번호 (필수)</li>
                        <li>• <strong>full_name</strong>: 이름 (필수)</li>
                        <li>• <strong>email</strong>: 이메일 (선택)</li>
                        <li>• <strong>role</strong>: 역할 - admin, teacher, student (필수)</li>
                        <li>• <strong>class_id</strong>: 클래스 ID (학생의 경우 필수)</li>
                    </ul>
                </div>
                
                <form id="bulk-upload-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">CSV 파일 선택</label>
                        <input type="file" name="file" accept=".csv,.txt" required 
                               class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    </div>
                    
                    <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded">
                        <i class="fas fa-upload mr-2"></i>파일 업로드 및 계정 생성
                    </button>
                </form>
                
                <div id="bulk-result" class="mt-6 hidden"></div>
            </div>
        `;
        
        document.getElementById('bulk-upload-form').addEventListener('submit', this.handleBulkUpload.bind(this));
    }
    
    async handleBulkUpload(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        try {
            const response = await fetch('/api/admin/users/bulk', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('bulk-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="space-y-4">
                        <div class="p-4 bg-green-900 border border-green-700 rounded-md text-green-300">
                            <i class="fas fa-check-circle mr-2"></i>
                            성공: ${data.success}명의 계정이 생성되었습니다.
                            ${data.errors > 0 ? `오류: ${data.errors}건` : ''}
                        </div>
                        
                        ${data.errorDetails && data.errorDetails.length > 0 ? `
                            <div class="p-4 bg-yellow-900 border border-yellow-700 rounded-md">
                                <h4 class="text-yellow-300 font-semibold mb-2">오류 상세:</h4>
                                <ul class="text-yellow-200 text-sm">
                                    ${data.errorDetails.map(error => `<li>• ${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="p-4 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('bulk-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-4 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>파일 업로드 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    showSystemStats() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <h2 class="text-2xl font-bold text-white mb-6">시스템 통계</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="bg-blue-900 p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-users text-3xl text-blue-300"></i>
                            <div class="ml-4">
                                <p class="text-blue-300 text-sm">전체 사용자</p>
                                <p class="text-white text-2xl font-bold" id="total-users">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-green-900 p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-chalkboard-teacher text-3xl text-green-300"></i>
                            <div class="ml-4">
                                <p class="text-green-300 text-sm">교사</p>
                                <p class="text-white text-2xl font-bold" id="total-teachers">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-purple-900 p-6 rounded-lg">
                        <div class="flex items-center">
                            <i class="fas fa-user-graduate text-3xl text-purple-300"></i>
                            <div class="ml-4">
                                <p class="text-purple-300 text-sm">학생</p>
                                <p class="text-white text-2xl font-bold" id="total-students">-</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadSystemStats();
    }
    
    async loadSystemStats() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const users = data.users;
                const totalUsers = users.length;
                const totalTeachers = users.filter(u => u.role === 'teacher').length;
                const totalStudents = users.filter(u => u.role === 'student').length;
                
                document.getElementById('total-users').textContent = totalUsers;
                document.getElementById('total-teachers').textContent = totalTeachers;
                document.getElementById('total-students').textContent = totalStudents;
            }
        } catch (error) {
            console.error('Failed to load system stats:', error);
        }
    }
    
    async showEditUserForm(userId) {
        try {
            // 기존 사용자 정보 가져오기
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            
            const user = data.users.find(u => u.id === userId);
            if (!user) {
                alert('사용자를 찾을 수 없습니다.');
                return;
            }
            
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-white">사용자 수정 (ID: #${user.id})</h2>
                        <button onclick="adminDashboard.showUserManagement()" 
                                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                            <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                        </button>
                    </div>
                    
                    <form id="edit-user-form" class="space-y-6">
                        <input type="hidden" name="user_id" value="${user.id}">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">사용자 ID</label>
                                <input type="text" name="username" value="${user.username}" required 
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">비밀번호 (변경시만 입력)</label>
                                <input type="password" name="password" placeholder="비밀번호를 변경하려면 입력하세요"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">이름</label>
                                <input type="text" name="full_name" value="${user.full_name}" required 
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">이메일</label>
                                <input type="email" name="email" value="${user.email || ''}" 
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">역할</label>
                                <select name="role" required class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>관리자</option>
                                    <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>교사</option>
                                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>학생</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">클래스 ID (학생만)</label>
                                <input type="text" name="class_id" value="${user.class_id || ''}" 
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            </div>
                        </div>
                        
                        <div class="flex space-x-4">
                            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                                <i class="fas fa-save mr-2"></i>수정 저장
                            </button>
                            <button type="button" onclick="adminDashboard.showUserManagement()" 
                                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded">
                                <i class="fas fa-times mr-2"></i>취소
                            </button>
                        </div>
                    </form>
                    
                    <div id="edit-result" class="mt-4 hidden"></div>
                </div>
            `;
            
            document.getElementById('edit-user-form').addEventListener('submit', this.handleEditUser.bind(this));
            
        } catch (error) {
            alert('사용자 정보를 불러오는데 실패했습니다.');
        }
    }
    
    async handleEditUser(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData.entries());
        const userId = userData.user_id;
        
        // user_id는 API 요청에서 제외
        delete userData.user_id;
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('edit-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>사용자 정보가 성공적으로 수정되었습니다.
                    </div>
                `;
                setTimeout(() => this.showUserManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('edit-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>사용자 수정 중 오류가 발생했습니다.
                </div>
            `;
        }
    }

    async deleteUser(userId) {
        if (!confirm('정말로 이 사용자를 삭제하시겠습니까?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.loadUsers(); // 사용자 목록 새로고침
            } else {
                const data = await response.json();
                alert(`삭제 실패: ${data.error}`);
            }
        } catch (error) {
            alert('사용자 삭제 중 오류가 발생했습니다.');
        }
    }
    
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
    
    // 비밀번호 변경 화면 표시
    showChangePassword() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6 max-w-2xl mx-auto">
                <div class="mb-6">
                    <h2 class="text-xl md:text-2xl font-bold text-white mb-2">
                        <i class="fas fa-key mr-2 text-yellow-400"></i>비밀번호 변경
                    </h2>
                    <p class="text-gray-400 text-sm">보안을 위해 정기적으로 비밀번호를 변경하는 것을 권장합니다.</p>
                </div>

                <form id="change-password-form" class="space-y-6">
                    <div>
                        <label for="current-password" class="block text-sm font-medium text-gray-300 mb-2">
                            <i class="fas fa-lock mr-1"></i>현재 비밀번호
                        </label>
                        <input type="password" id="current-password" name="current-password" required 
                               class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                               placeholder="현재 비밀번호를 입력하세요">
                    </div>
                    
                    <div>
                        <label for="new-password" class="block text-sm font-medium text-gray-300 mb-2">
                            <i class="fas fa-key mr-1"></i>새 비밀번호
                        </label>
                        <input type="password" id="new-password" name="new-password" required 
                               minlength="6"
                               class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                               placeholder="새 비밀번호를 입력하세요 (최소 6자리)">
                        <div class="mt-2">
                            <div id="password-strength" class="text-xs text-gray-400">
                                <span id="strength-text">비밀번호 강도: </span>
                                <span id="strength-bar" class="inline-block w-20 h-1 bg-gray-600 rounded ml-2"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label for="confirm-password" class="block text-sm font-medium text-gray-300 mb-2">
                            <i class="fas fa-check-circle mr-1"></i>새 비밀번호 확인
                        </label>
                        <input type="password" id="confirm-password" name="confirm-password" required 
                               minlength="6"
                               class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-white"
                               placeholder="새 비밀번호를 다시 입력하세요">
                        <div id="password-match" class="mt-2 text-xs hidden">
                            <span class="text-red-400"><i class="fas fa-times mr-1"></i>비밀번호가 일치하지 않습니다</span>
                        </div>
                    </div>

                    <div class="bg-blue-900 border border-blue-700 p-4 rounded-lg">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-400 mr-2 mt-0.5"></i>
                            <div class="text-sm text-blue-200">
                                <p class="font-semibold mb-1">비밀번호 보안 팁:</p>
                                <ul class="list-disc list-inside space-y-1 text-xs">
                                    <li>최소 6자리 이상 사용하세요</li>
                                    <li>숫자, 영문자, 특수문자를 조합하세요</li>
                                    <li>개인정보와 관련된 단어는 피하세요</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button type="button" onclick="adminDashboard.showUserManagement()" 
                                class="w-full sm:w-auto px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition duration-300">
                            <i class="fas fa-times mr-2"></i>취소
                        </button>
                        <button type="submit" id="change-password-btn"
                                class="w-full sm:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            <i class="fas fa-key mr-2"></i>비밀번호 변경
                        </button>
                    </div>
                </form>

                <div id="change-password-message" class="mt-4 p-3 rounded-md text-sm hidden">
                </div>
            </div>
        `;
        
        this.setupPasswordChangeListeners();
    }
    
    setupPasswordChangeListeners() {
        const form = document.getElementById('change-password-form');
        const newPasswordInput = document.getElementById('new-password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const passwordMatchDiv = document.getElementById('password-match');
        
        // 비밀번호 강도 체크
        newPasswordInput.addEventListener('input', () => {
            this.checkPasswordStrength(newPasswordInput.value);
        });
        
        // 비밀번호 일치 체크
        confirmPasswordInput.addEventListener('input', () => {
            const newPassword = newPasswordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            
            if (confirmPassword && newPassword !== confirmPassword) {
                passwordMatchDiv.classList.remove('hidden');
                confirmPasswordInput.classList.add('border-red-500');
            } else {
                passwordMatchDiv.classList.add('hidden');
                confirmPasswordInput.classList.remove('border-red-500');
            }
        });
        
        // 폼 제출
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordChange();
        });
    }
    
    checkPasswordStrength(password) {
        const strengthText = document.getElementById('strength-text');
        const strengthBar = document.getElementById('strength-bar');
        
        let strength = 0;
        let color = 'bg-red-500';
        let text = '매우 약함';
        
        if (password.length >= 6) strength += 1;
        if (password.match(/[a-z]/)) strength += 1;
        if (password.match(/[A-Z]/)) strength += 1;
        if (password.match(/[0-9]/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]/)) strength += 1;
        
        if (strength >= 4) {
            color = 'bg-green-500';
            text = '강함';
        } else if (strength >= 3) {
            color = 'bg-yellow-500';
            text = '보통';
        } else if (strength >= 2) {
            color = 'bg-orange-500';
            text = '약함';
        }
        
        strengthText.textContent = `비밀번호 강도: ${text}`;
        strengthBar.className = `inline-block w-20 h-1 rounded ml-2 ${color}`;
    }
    
    async handlePasswordChange() {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageDiv = document.getElementById('change-password-message');
        const submitBtn = document.getElementById('change-password-btn');
        
        // 유효성 검사
        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showPasswordMessage('모든 필드를 입력해주세요.', 'error');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showPasswordMessage('새 비밀번호가 일치하지 않습니다.', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showPasswordMessage('새 비밀번호는 최소 6자리 이상이어야 합니다.', 'error');
            return;
        }
        
        // 로딩 상태
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>변경 중...';
        
        try {
            const response = await fetch('/api/admin/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showPasswordMessage('비밀번호가 성공적으로 변경되었습니다!', 'success');
                // 폼 초기화
                document.getElementById('change-password-form').reset();
                // 3초 후 사용자 관리로 이동
                setTimeout(() => {
                    this.showUserManagement();
                }, 3000);
            } else {
                this.showPasswordMessage(data.error || '비밀번호 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showPasswordMessage('서버 연결에 실패했습니다.', 'error');
        } finally {
            // 로딩 상태 해제
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-key mr-2"></i>비밀번호 변경';
        }
    }
    
    showPasswordMessage(message, type) {
        const messageDiv = document.getElementById('change-password-message');
        messageDiv.className = `mt-4 p-3 rounded-md text-sm ${
            type === 'success' 
                ? 'bg-green-900 border border-green-700 text-green-300' 
                : 'bg-red-900 border border-red-700 text-red-300'
        }`;
        messageDiv.textContent = message;
        messageDiv.classList.remove('hidden');
        
        // 5초 후 메시지 숨김
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 5000);
    }
    
    // 클래스 관리 화면 표시
    async showClassManagement() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-4 md:p-6">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                    <h2 class="text-xl md:text-2xl font-bold text-white">
                        <i class="fas fa-school mr-2 text-blue-400"></i>클래스 관리
                    </h2>
                    <button onclick="adminDashboard.showCreateClassForm()" 
                            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm md:text-base w-full sm:w-auto">
                        <i class="fas fa-plus mr-2"></i>클래스 추가
                    </button>
                </div>
                
                <div id="classes-table">
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p class="text-gray-400 mt-2">클래스 목록을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        `;
        
        await this.loadClasses();
    }
    
    async loadClasses() {
        try {
            const response = await fetch('/api/admin/classes', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderClassesTable(data.classes);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            document.getElementById('classes-table').innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                    <p class="text-red-400 mt-2">클래스 목록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderClassesTable(classes) {
        const classesTable = document.getElementById('classes-table');
        
        if (classes.length === 0) {
            classesTable.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-school text-2xl text-gray-400"></i>
                    <p class="text-gray-400 mt-2">등록된 클래스가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        // 데스크톱 테이블 (md 이상에서 표시)
        classesTable.innerHTML = `
            <!-- 데스크톱 테이블 -->
            <div class="hidden md:block overflow-x-auto">
                <table class="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                    <thead class="bg-gray-600">
                        <tr>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">클래스 ID</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">클래스명</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">담당 교사</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">학생 수</th>
                            <th class="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">생성일</th>
                            <th class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">작업</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-600">
                        ${classes.map(classItem => `
                            <tr class="hover:bg-gray-600">
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-blue-300 font-mono">${classItem.id}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">${classItem.name}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    ${classItem.teacher_name ? classItem.teacher_name + ' 선생님' : '담당 교사 없음'}
                                </td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <span class="px-2 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                                        ${classItem.student_count}명
                                    </span>
                                </td>
                                <td class="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-300">${this.formatKoreanDate(classItem.created_at)}</td>
                                <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                    <div class="flex space-x-2">
                                        <button onclick="adminDashboard.showEditClassForm('${classItem.id}')" 
                                                class="text-blue-400 hover:text-blue-300" title="수정">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="adminDashboard.deleteClass('${classItem.id}')" 
                                                class="text-red-400 hover:text-red-300" title="삭제">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- 모바일 카드 뷰 (md 미만에서 표시) -->
            <div class="md:hidden space-y-4">
                ${classes.map(classItem => `
                    <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <div class="flex items-center space-x-2">
                                    <span class="text-blue-300 font-mono text-sm">${classItem.id}</span>
                                    <span class="px-2 py-1 bg-blue-900 text-blue-200 rounded-full text-xs">
                                        ${classItem.student_count}명
                                    </span>
                                </div>
                                <h3 class="text-white font-medium text-lg">${classItem.name}</h3>
                                <p class="text-gray-300 text-sm">
                                    ${classItem.teacher_name ? classItem.teacher_name + ' 선생님' : '담당 교사 없음'}
                                </p>
                            </div>
                            <div class="flex space-x-2">
                                <button onclick="adminDashboard.showEditClassForm('${classItem.id}')" 
                                        class="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded" title="수정">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="adminDashboard.deleteClass('${classItem.id}')" 
                                        class="p-2 text-red-400 hover:text-red-300 hover:bg-gray-600 rounded" title="삭제">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center text-gray-300 text-sm">
                            <i class="fas fa-calendar mr-2 w-4"></i>
                            <span>생성일: ${this.formatKoreanDate(classItem.created_at)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    showCreateClassForm() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">
                        <i class="fas fa-plus-circle mr-2 text-green-400"></i>클래스 추가
                    </h2>
                    <button onclick="adminDashboard.showClassManagement()" 
                            class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                        <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                    </button>
                </div>
                
                <div class="mb-6 p-4 bg-blue-900 border border-blue-700 rounded-md">
                    <div class="flex items-start">
                        <i class="fas fa-info-circle text-blue-400 mr-2 mt-0.5"></i>
                        <div class="text-sm text-blue-200">
                            <p class="font-semibold mb-1">클래스 생성 안내:</p>
                            <ul class="list-disc list-inside space-y-1 text-xs">
                                <li><strong>클래스 ID:</strong> 학생 로그인용 식별자 (한글/영문/숫자/특수문자 모두 가능, 생성 후 변경 불가)</li>
                                <li><strong>클래스명:</strong> 화면 표시용 이름 (자유롭게 변경 가능)</li>
                                <li><strong>담당 교사:</strong> 선택사항이며, 나중에 변경할 수 있습니다</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <form id="create-class-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <i class="fas fa-tag mr-1"></i>클래스 ID
                            </label>
                            <input type="text" name="id" required 
                                   placeholder="예: 1학년A반, 파이썬기초, coding2024"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                            <p class="text-xs text-green-400 mt-1">✅ 한글, 영문, 숫자, 특수문자 모두 사용 가능 (학생 로그인 ID)</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <i class="fas fa-graduation-cap mr-1"></i>클래스명 (표시용)
                            </label>
                            <input type="text" name="name" required 
                                   placeholder="예: 1학년 A반, 파이썬 기초반, 수학 심화반"
                                   class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                            <p class="text-xs text-gray-400 mt-1">한글, 영문, 숫자 모두 사용 가능</p>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <i class="fas fa-chalkboard-teacher mr-1"></i>담당 교사 (선택)
                            </label>
                            <select name="teacher_id" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                                <option value="">담당 교사 없음</option>
                                <!-- 교사 목록은 로딩 후 채워짐 -->
                            </select>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-300 mb-2">
                                <i class="fas fa-align-left mr-1"></i>설명 (선택)
                            </label>
                            <textarea name="description" rows="3" 
                                      placeholder="클래스에 대한 간단한 설명을 입력하세요"
                                      class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                        <i class="fas fa-plus mr-2"></i>클래스 생성
                    </button>
                </form>
                
                <div id="create-class-result" class="mt-4 hidden"></div>
            </div>
        `;
        
        // 교사 목록 로드
        this.loadTeachersForClassForm();
        
        document.getElementById('create-class-form').addEventListener('submit', this.handleCreateClass.bind(this));
    }
    
    async loadTeachersForClassForm() {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const teachers = data.users.filter(user => user.role === 'teacher');
                const teacherSelect = document.querySelector('select[name="teacher_id"]');
                
                teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.id;
                    option.textContent = `${teacher.full_name} 선생님 (@${teacher.username})`;
                    teacherSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load teachers:', error);
        }
    }
    
    async handleCreateClass(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const classData = Object.fromEntries(formData.entries());
        
        // 빈 값 제거
        if (!classData.teacher_id) delete classData.teacher_id;
        if (!classData.description) delete classData.description;
        
        try {
            const response = await fetch('/api/admin/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(classData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('create-class-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>클래스가 성공적으로 생성되었습니다.
                    </div>
                `;
                e.target.reset();
                setTimeout(() => this.showClassManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('create-class-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>클래스 생성 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    async showEditClassForm(classId) {
        try {
            // 클래스 정보 가져오기
            const response = await fetch('/api/admin/classes', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error);
            }
            
            const classItem = data.classes.find(c => c.id === classId);
            if (!classItem) {
                alert('클래스를 찾을 수 없습니다.');
                return;
            }
            
            const mainContent = document.getElementById('main-content');
            mainContent.innerHTML = `
                <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-white">
                            <i class="fas fa-edit mr-2 text-yellow-400"></i>클래스 수정 (ID: ${classItem.id})
                        </h2>
                        <button onclick="adminDashboard.showClassManagement()" 
                                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white">
                            <i class="fas fa-arrow-left mr-2"></i>뒤로가기
                        </button>
                    </div>
                    
                    <form id="edit-class-form" class="space-y-6">
                        <input type="hidden" name="original_class_id" value="${classItem.id}">
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">
                                    <i class="fas fa-tag mr-1"></i>클래스 ID (변경 불가)
                                </label>
                                <input type="text" value="${classItem.id}" disabled 
                                       class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-400 cursor-not-allowed">
                                <input type="hidden" name="id" value="${classItem.id}">
                                <p class="text-xs text-yellow-400 mt-1">⚠️ 클래스 ID는 학생 로그인용이므로 변경할 수 없습니다</p>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">
                                    <i class="fas fa-graduation-cap mr-1"></i>클래스명 (표시용)
                                </label>
                                <input type="text" name="name" value="${classItem.name}" required 
                                       placeholder="예: 1학년 A반, 파이썬 기초반"
                                       class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                                <p class="text-xs text-green-400 mt-1">✅ 한글/영문 자유롭게 변경 가능 (로그인에 영향 없음)</p>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-300 mb-2">
                                    <i class="fas fa-chalkboard-teacher mr-1"></i>담당 교사
                                </label>
                                <select name="teacher_id" class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                                    <option value="">담당 교사 없음</option>
                                    <!-- 교사 목록은 로딩 후 채워짐 -->
                                </select>
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-300 mb-2">
                                    <i class="fas fa-align-left mr-1"></i>설명
                                </label>
                                <textarea name="description" rows="3" 
                                          class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500">${classItem.description || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="flex space-x-4">
                            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded">
                                <i class="fas fa-save mr-2"></i>수정 저장
                            </button>
                            <button type="button" onclick="adminDashboard.showClassManagement()" 
                                    class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded">
                                <i class="fas fa-times mr-2"></i>취소
                            </button>
                        </div>
                    </form>
                    
                    <div id="edit-class-result" class="mt-4 hidden"></div>
                </div>
            `;
            
            // 교사 목록 로드 및 현재 교사 선택
            await this.loadTeachersForEditForm(classItem.teacher_id);
            
            document.getElementById('edit-class-form').addEventListener('submit', this.handleEditClass.bind(this));
            
        } catch (error) {
            alert('클래스 정보를 불러오는데 실패했습니다.');
        }
    }
    
    async loadTeachersForEditForm(currentTeacherId) {
        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const teachers = data.users.filter(user => user.role === 'teacher');
                const teacherSelect = document.querySelector('select[name="teacher_id"]');
                
                teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.id;
                    option.textContent = `${teacher.full_name} 선생님 (@${teacher.username})`;
                    if (teacher.id == currentTeacherId) {
                        option.selected = true;
                    }
                    teacherSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Failed to load teachers:', error);
        }
    }
    
    async handleEditClass(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const classData = Object.fromEntries(formData.entries());
        const originalClassId = classData.original_class_id;
        
        // original_class_id는 API 요청에서 제외
        delete classData.original_class_id;
        
        // 빈 값 제거
        if (!classData.teacher_id) delete classData.teacher_id;
        if (!classData.description) delete classData.description;
        
        try {
            const response = await fetch(`/api/admin/classes/${originalClassId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(classData)
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('edit-class-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-green-900 border border-green-700 rounded-md text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>클래스 정보가 성공적으로 수정되었습니다.
                    </div>
                `;
                setTimeout(() => this.showClassManagement(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('edit-class-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-3 bg-red-900 border border-red-700 rounded-md text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>클래스 수정 중 오류가 발생했습니다.
                </div>
            `;
        }
    }
    
    async deleteClass(classId) {
        if (!confirm('정말로 이 클래스를 삭제하시겠습니까?\n\n주의: 이 클래스에 속한 학생들은 로그인할 수 없게 됩니다.')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/admin/classes/${classId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.loadClasses(); // 클래스 목록 새로고침
            } else {
                const data = await response.json();
                alert(`삭제 실패: ${data.error}`);
            }
        } catch (error) {
            alert('클래스 삭제 중 오류가 발생했습니다.');
        }
    }
}

// 페이지 로드 시 초기화
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});