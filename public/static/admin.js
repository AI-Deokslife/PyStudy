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
    
    renderHeader() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header class="bg-gray-800 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <i class="fas fa-user-shield text-2xl text-red-400 mr-3"></i>
                            <h1 class="text-xl font-semibold text-white">관리자 대시보드</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <span class="text-gray-300">${this.user.full_name}</span>
                            <button onclick="adminDashboard.logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
                                <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <div class="flex min-h-screen bg-gray-900">
                <nav id="sidebar" class="w-64 bg-gray-800 shadow-lg">
                    <!-- 네비게이션 메뉴 -->
                </nav>
                <main id="main-content" class="flex-1 p-6">
                    <!-- 메인 콘텐츠 -->
                </main>
            </div>
        `;
    }
    
    renderNavigation() {
        const sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = `
            <div class="p-6">
                <ul class="space-y-2">
                    <li>
                        <button onclick="adminDashboard.showUserManagement()" 
                                class="w-full text-left flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded">
                            <i class="fas fa-users mr-3"></i>사용자 관리
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.showBulkUserCreate()" 
                                class="w-full text-left flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded">
                            <i class="fas fa-file-excel mr-3"></i>엑셀로 계정 생성
                        </button>
                    </li>
                    <li>
                        <button onclick="adminDashboard.showSystemStats()" 
                                class="w-full text-left flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded">
                            <i class="fas fa-chart-bar mr-3"></i>시스템 통계
                        </button>
                    </li>
                </ul>
            </div>
        `;
    }
    
    async showUserManagement() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">사용자 관리</h2>
                    <button onclick="adminDashboard.showCreateUserForm()" 
                            class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                        <i class="fas fa-plus mr-2"></i>사용자 추가
                    </button>
                </div>
                
                <div id="users-table" class="overflow-x-auto">
                    <div class="text-center py-4">
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
        
        usersTable.innerHTML = `
            <table class="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                <thead class="bg-gray-600">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">사용자명</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이름</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">이메일</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">역할</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">클래스</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">가입일</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">작업</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-600">
                    ${users.map(user => `
                        <tr class="hover:bg-gray-600">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${user.username}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${user.full_name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.email || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${this.getRoleBadgeColor(user.role)}">
                                    ${this.getRoleText(user.role)}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${user.class_id || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${new Date(user.created_at).toLocaleDateString('ko-KR')}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                <button onclick="adminDashboard.deleteUser(${user.id})" 
                                        class="text-red-400 hover:text-red-300">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
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
                            <label class="block text-sm font-medium text-gray-300 mb-2">사용자명</label>
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
                        <li>• <strong>username</strong>: 사용자명 (필수)</li>
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
}

// 페이지 로드 시 초기화
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});