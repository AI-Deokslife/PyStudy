// 학생 학습 환경 JavaScript (기존 Pyodide 코드 확장)

class StudentEnvironment {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (!this.token || this.user.role !== 'student') {
            window.location.href = '/';
            return;
        }
        
        this.pyodide = null;
        this.editor = null;
        this.currentSession = null;
        this.pollingInterval = null;
        
        this.init();
    }
    
    init() {
        this.renderHeader();
        this.renderMainInterface();
        this.initializePyodide();
        this.startSessionPolling();
    }
    
    renderHeader() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <header class="bg-gray-800 shadow-lg sticky top-0 z-40">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <i class="fas fa-user-graduate text-lg md:text-2xl text-green-400 mr-2 md:mr-3"></i>
                            <h1 class="text-sm md:text-xl font-semibold text-white">파이썬 학습 환경</h1>
                        </div>
                        <div class="flex items-center space-x-2 md:space-x-4">
                            <div id="session-indicator" class="hidden sm:flex items-center">
                                <div class="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                                <span class="text-gray-400 text-xs md:text-sm">세션 확인 중...</span>
                            </div>
                            <span class="text-gray-300 text-xs md:text-sm hidden lg:inline">${this.user.full_name} (${this.user.class_id || '클래스 미지정'})</span>
                            <button onclick="studentEnv.logout()" class="bg-red-600 hover:bg-red-700 px-2 md:px-4 py-2 rounded text-white text-xs md:text-sm">
                                <i class="fas fa-sign-out-alt mr-1 md:mr-2"></i><span class="hidden sm:inline">로그아웃</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            
            <main id="main-content" class="min-h-screen bg-gray-900">
                <!-- 메인 콘텐츠 -->
            </main>
        `;
    }
    
    renderMainInterface() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <!-- 로딩 오버레이 -->
            <div id="loader-overlay" class="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
                <div class="text-center">
                    <div class="w-16 h-16 border-4 border-gray-300 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
                    <p class="text-lg text-white">파이썬 환경을 준비 중입니다...</p>
                    <p class="text-sm text-gray-400">처음 실행 시 몇 초 정도 소요될 수 있습니다.</p>
                </div>
            </div>

            <!-- 활성 문제 알림 -->
            <div id="problem-notification" class="hidden fixed top-16 md:top-20 left-2 right-2 md:left-auto md:right-4 bg-blue-900 border border-blue-700 p-3 md:p-4 rounded-lg shadow-xl z-40 max-w-sm md:max-w-md">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-circle text-blue-400 text-lg md:text-xl mr-2 md:mr-3 mt-1"></i>
                    <div class="flex-1">
                        <h4 class="text-blue-300 font-semibold text-sm md:text-base">새로운 문제가 출제되었습니다!</h4>
                        <p id="problem-title" class="text-blue-200 text-xs md:text-sm mt-1"></p>
                        <div class="mt-3 flex flex-col sm:flex-row gap-2 sm:space-x-2">
                            <button onclick="studentEnv.loadCurrentProblem()" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-xs md:text-sm">
                                문제 보기
                            </button>
                            <button onclick="studentEnv.dismissNotification()" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white text-xs md:text-sm">
                                나중에
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container mx-auto p-2 md:p-4 max-w-7xl">
                <!-- 탭 네비게이션 -->
                <div class="flex mb-4 md:mb-6 bg-gray-800 rounded-lg p-1 md:p-2 overflow-x-auto">
                    <button id="tab-practice" onclick="studentEnv.switchTab('practice')" 
                            class="flex-1 py-2 px-2 md:px-4 text-center rounded bg-cyan-600 text-white font-semibold whitespace-nowrap text-xs md:text-sm">
                        <i class="fas fa-code mr-1 md:mr-2"></i><span class="hidden sm:inline">자유 </span>연습
                    </button>
                    <button id="tab-problem" onclick="studentEnv.switchTab('problem')" 
                            class="flex-1 py-2 px-2 md:px-4 text-center rounded text-gray-300 hover:bg-gray-700 whitespace-nowrap text-xs md:text-sm">
                        <i class="fas fa-tasks mr-1 md:mr-2"></i><span class="hidden sm:inline">출제된 </span>문제
                    </button>
                    <button id="tab-history" onclick="studentEnv.switchTab('history')" 
                            class="flex-1 py-2 px-2 md:px-4 text-center rounded text-gray-300 hover:bg-gray-700 whitespace-nowrap text-xs md:text-sm">
                        <i class="fas fa-history mr-1 md:mr-2"></i><span class="hidden sm:inline">제출 </span>기록
                    </button>
                </div>

                <!-- 자유 연습 탭 -->
                <div id="practice-tab" class="tab-content">
                    <div class="flex flex-col gap-4 md:gap-6 min-h-[calc(100vh-200px)]">
                        <!-- 코드 에디터 섹션 -->
                        <div class="flex flex-col bg-gray-800 rounded-lg shadow-lg">
                            <div class="flex-1 flex flex-col">
                                <div class="p-2 md:p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                                    <h2 class="text-base md:text-lg font-semibold text-white">코딩 영역</h2>
                                </div>
                                <textarea id="code-editor" class="w-full h-48 md:h-64 lg:h-80 p-3 md:p-4 bg-gray-900 text-green-300 font-mono text-sm md:text-base focus:outline-none resize-none" spellcheck="false"></textarea>
                            </div>
                            <div class="p-2 md:p-3 bg-gray-700 border-t border-gray-500 flex flex-col gap-2 md:gap-3">
                                <!-- 모바일: 버튼을 2x2 그리드로 배치 -->
                                <div class="grid grid-cols-2 gap-2 md:hidden">
                                    <button id="run-btn" disabled class="bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-2 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed text-xs">
                                        <i class="fas fa-play mr-1"></i>실행
                                    </button>
                                    <button id="clear-code-btn" class="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-2 rounded-md transition duration-300 text-xs">
                                        <i class="fas fa-eraser mr-1"></i>삭제
                                    </button>
                                    <button id="save-file-btn" class="bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded-md transition duration-300 text-xs">
                                        <i class="fas fa-save mr-1"></i>저장
                                    </button>
                                    <button id="load-file-btn" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-md transition duration-300 text-xs">
                                        <i class="fas fa-folder-open mr-1"></i>불러오기
                                    </button>
                                </div>
                                
                                <!-- 데스크톱: 기존 레이아웃 유지 -->
                                <div class="hidden md:flex gap-3">
                                    <button id="run-btn-desktop" disabled class="w-1/3 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        <i class="fas fa-play mr-2"></i>코드 실행
                                    </button>
                                    <button id="clear-code-btn-desktop" class="w-1/3 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-eraser mr-2"></i>코드 삭제
                                    </button>
                                    <button id="clear-output-btn-desktop" class="w-1/3 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-trash mr-2"></i>결과 삭제
                                    </button>
                                </div>
                                <div class="hidden md:flex gap-3">
                                    <button id="save-file-btn-desktop" class="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-save mr-2"></i>파일로 저장
                                    </button>
                                    <button id="load-file-btn-desktop" class="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-folder-open mr-2"></i>파일 불러오기
                                    </button>
                                </div>
                                <span id="status-message" class="text-center text-xs md:text-sm text-gray-400 h-4 transition-opacity duration-500 opacity-0"></span>
                            </div>
                        </div>

                        <!-- 실행 결과 섹션 -->
                        <div class="flex flex-col bg-gray-800 rounded-lg shadow-lg">
                            <div class="p-2 md:p-3 bg-gray-700 rounded-t-lg border-b border-gray-600 flex items-center justify-between">
                                <h2 class="text-base md:text-lg font-semibold text-white">실행 결과</h2>
                                <button id="clear-output-btn-mobile" class="md:hidden bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs">
                                    <i class="fas fa-trash mr-1"></i>삭제
                                </button>
                            </div>
                            <pre id="output" class="w-full h-48 md:h-64 p-3 md:p-4 bg-gray-900 text-white font-mono text-xs md:text-base overflow-auto whitespace-pre-wrap break-words">결과는 여기에 표시됩니다.</pre>
                        </div>
                    </div>
                </div>

                <!-- 문제 탭 -->
                <div id="problem-tab" class="tab-content hidden">
                    <div id="problem-content">
                        <div class="text-center py-12 bg-gray-800 rounded-lg">
                            <i class="fas fa-tasks text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-400">현재 출제된 문제가 없습니다.</p>
                        </div>
                    </div>
                </div>

                <!-- 기록 탭 -->
                <div id="history-tab" class="tab-content hidden">
                    <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 class="text-2xl font-bold text-white mb-6">제출 기록</h2>
                        <div id="submissions-history">
                            <div class="text-center py-4">
                                <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                                <p class="text-gray-400 mt-2">제출 기록을 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 숨겨진 파일 입력 필드 -->
            <input type="file" id="file-loader" class="hidden" accept=".py,.txt">

            <!-- 파일 저장 모달 -->
            <div id="save-modal-overlay" class="fixed inset-0 bg-black bg-opacity-70 z-50 hidden justify-center items-center">
                <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
                    <h3 class="text-xl font-bold mb-4 text-white">파일 이름 지정</h3>
                    <p class="text-gray-400 mb-4 text-sm">저장할 파일의 이름을 입력하세요.</p>
                    <input type="text" id="filename-input" class="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white mb-6 focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="my_code.py">
                    <div class="flex justify-end gap-3">
                        <button id="cancel-save-btn" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md transition duration-300">취소</button>
                        <button id="confirm-save-btn" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition duration-300">저장</button>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 모바일 버튼 이벤트
        const runBtn = document.getElementById('run-btn');
        const clearOutputBtn = document.getElementById('clear-output-btn-mobile');
        const clearCodeBtn = document.getElementById('clear-code-btn');
        const saveFileBtn = document.getElementById('save-file-btn');
        const loadFileBtn = document.getElementById('load-file-btn');
        
        if (runBtn) runBtn.addEventListener('click', () => this.runPythonCode());
        if (clearOutputBtn) clearOutputBtn.addEventListener('click', () => this.clearOutput());
        if (clearCodeBtn) clearCodeBtn.addEventListener('click', () => this.clearCode());
        if (saveFileBtn) saveFileBtn.addEventListener('click', () => this.showSaveModal());
        if (loadFileBtn) loadFileBtn.addEventListener('click', () => this.loadFile());
        
        // 데스크톱 버튼 이벤트
        const runBtnDesktop = document.getElementById('run-btn-desktop');
        const clearOutputBtnDesktop = document.getElementById('clear-output-btn-desktop');
        const clearCodeBtnDesktop = document.getElementById('clear-code-btn-desktop');
        const saveFileBtnDesktop = document.getElementById('save-file-btn-desktop');
        const loadFileBtnDesktop = document.getElementById('load-file-btn-desktop');
        
        if (runBtnDesktop) runBtnDesktop.addEventListener('click', () => this.runPythonCode());
        if (clearOutputBtnDesktop) clearOutputBtnDesktop.addEventListener('click', () => this.clearOutput());
        if (clearCodeBtnDesktop) clearCodeBtnDesktop.addEventListener('click', () => this.clearCode());
        if (saveFileBtnDesktop) saveFileBtnDesktop.addEventListener('click', () => this.showSaveModal());
        if (loadFileBtnDesktop) loadFileBtnDesktop.addEventListener('click', () => this.loadFile());
        
        // 파일 처리
        const fileLoader = document.getElementById('file-loader');
        if (fileLoader) fileLoader.addEventListener('change', (e) => this.handleFileLoad(e));
        
        // 모달 이벤트
        const cancelSaveBtn = document.getElementById('cancel-save-btn');
        const confirmSaveBtn = document.getElementById('confirm-save-btn');
        const filenameInput = document.getElementById('filename-input');
        
        if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', () => this.hideSaveModal());
        if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', () => this.saveFile());
        if (filenameInput) filenameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.saveFile();
        });
    }
    
    async initializePyodide() {
        try {
            this.pyodide = await loadPyodide();
            await this.pyodide.runPythonAsync(`
from js import window
import builtins

def _js_input(prompt=""):
    res = window.prompt(prompt)
    return "" if res is None else str(res)

builtins.input = _js_input
            `);
            
            // CodeMirror 초기화
            try {
                this.editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
                    mode: 'python',
                    theme: 'dracula',
                    lineNumbers: true,
                    indentUnit: 4
                });
                this.editor.setValue(`# 파이썬 학습 환경에 오신 것을 환영합니다!
# 이곳에서 자유롭게 파이썬 코드를 연습할 수 있습니다.

name = input("이름을 입력하세요: ")
print(f"안녕하세요, {name}님!")

# 반복문 예제
for i in range(1, 4):
    print(f"{i}번째 출력: Hello, Python!")`);
            } catch (error) {
                console.error("CodeMirror 초기화 실패:", error);
            }
            
            document.getElementById('loader-overlay').style.display = 'none';
            
            // 실행 버튼 활성화 (모바일 및 데스크톱)
            const runBtn = document.getElementById('run-btn');
            const runBtnDesktop = document.getElementById('run-btn-desktop');
            if (runBtn) runBtn.disabled = false;
            if (runBtnDesktop) runBtnDesktop.disabled = false;
            
            console.log("Pyodide 및 input() shim이 준비되었습니다.");
            
        } catch (error) {
            console.error("Pyodide 로딩 중 오류:", error);
            const loaderOverlay = document.getElementById('loader-overlay');
            loaderOverlay.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-400 text-lg">파이썬 환경을 불러오지 못했습니다.</p>
                    <p class="text-gray-400 text-sm mt-2">페이지를 새로고침해주세요.</p>
                    <button onclick="window.location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">
                        새로고침
                    </button>
                </div>
            `;
        }
    }
    
    async runPythonCode() {
        const code = this.editor.getValue();
        if (!this.pyodide) {
            this.showOutput("Pyodide가 아직 준비되지 않았습니다.");
            return;
        }
        
        this.showOutput('코드를 실행 중입니다...');
        
        try {
            let capturedOutput = '';
            this.pyodide.setStdout({ batched: (str) => { capturedOutput += str + '\n'; } });
            this.pyodide.setStderr({ batched: (str) => { capturedOutput += str + '\n'; } });
            
            await this.pyodide.runPythonAsync(code);
            this.showOutput(capturedOutput.trim() || '실행이 완료되었습니다. (출력 없음)');
            
        } catch (err) {
            this.showOutput(`오류 발생:\n${err.toString()}`);
        } finally {
            this.pyodide.setStdout();
            this.pyodide.setStderr();
        }
    }
    
    showOutput(text) {
        document.getElementById('output').textContent = text;
    }
    
    clearOutput() {
        this.showOutput('결과는 여기에 표시됩니다.');
    }
    
    clearCode() {
        if (this.editor) {
            this.editor.setValue('');
        }
    }
    
    showSaveModal() {
        document.getElementById('filename-input').value = 'my_code.py';
        document.getElementById('save-modal-overlay').classList.remove('hidden');
        document.getElementById('save-modal-overlay').classList.add('flex');
        setTimeout(() => document.getElementById('filename-input').focus(), 100);
    }
    
    hideSaveModal() {
        document.getElementById('save-modal-overlay').classList.add('hidden');
        document.getElementById('save-modal-overlay').classList.remove('flex');
    }
    
    saveFile() {
        let filename = document.getElementById('filename-input').value.trim();
        if (filename === "") {
            this.showStatusMessage("파일 이름을 입력해야 합니다.", true);
            return;
        }
        
        if (!filename.toLowerCase().endsWith('.py')) {
            filename += '.py';
        }
        
        const code = this.editor.getValue();
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.hideSaveModal();
        this.showStatusMessage(`'${filename}'(으)로 저장되었습니다.`);
    }
    
    loadFile() {
        document.getElementById('file-loader').click();
    }
    
    handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.editor.setValue(e.target.result);
            this.showStatusMessage('파일을 성공적으로 불러왔습니다.');
        };
        reader.onerror = () => {
            this.showStatusMessage('파일 읽기 중 오류가 발생했습니다.', true);
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    showStatusMessage(message, isError = false) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.style.color = isError ? '#f87171' : '#9ca3af';
        statusMessage.classList.remove('opacity-0');
        
        clearTimeout(this.statusTimeout);
        this.statusTimeout = setTimeout(() => {
            statusMessage.classList.add('opacity-0');
        }, 2500);
    }
    
    switchTab(tabName) {
        // 탭 버튼 업데이트
        document.querySelectorAll('[id^="tab-"]').forEach(btn => {
            btn.classList.remove('bg-cyan-600', 'text-white');
            btn.classList.add('text-gray-300', 'hover:bg-gray-700');
        });
        document.getElementById(`tab-${tabName}`).classList.add('bg-cyan-600', 'text-white');
        document.getElementById(`tab-${tabName}`).classList.remove('text-gray-300', 'hover:bg-gray-700');
        
        // 탭 콘텐츠 업데이트
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        
        // 탭별 특별 처리
        if (tabName === 'problem') {
            this.loadCurrentProblem();
        } else if (tabName === 'history') {
            this.loadSubmissionHistory();
        }
    }
    
    async startSessionPolling() {
        // 즉시 한 번 실행
        await this.checkActiveSessions();
        
        // 5초마다 세션 확인
        this.pollingInterval = setInterval(() => {
            this.checkActiveSessions();
        }, 5000);
    }
    
    async checkActiveSessions() {
        try {
            const response = await fetch('/api/student/sessions/active', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok && data.sessions.length > 0) {
                const session = data.sessions[0]; // 가장 최근 세션
                
                // 새로운 세션인 경우 알림 표시
                if (!this.currentSession || this.currentSession.id !== session.id) {
                    this.currentSession = session;
                    this.showProblemNotification(session);
                }
                
                this.updateSessionIndicator(true, session.title);
            } else {
                this.currentSession = null;
                this.updateSessionIndicator(false);
            }
        } catch (error) {
            console.error('세션 확인 중 오류:', error);
            this.updateSessionIndicator(false);
        }
    }
    
    updateSessionIndicator(hasActiveSession, sessionTitle = '') {
        const indicator = document.getElementById('session-indicator');
        const dot = indicator.querySelector('.w-2');
        const text = indicator.querySelector('span');
        
        if (hasActiveSession) {
            dot.className = 'w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2';
            text.textContent = `활성 세션: ${sessionTitle}`;
            text.className = 'text-green-400 text-sm';
        } else {
            dot.className = 'w-2 h-2 bg-gray-500 rounded-full mr-2';
            text.textContent = '활성 세션 없음';
            text.className = 'text-gray-400 text-sm';
        }
    }
    
    showProblemNotification(session) {
        const notification = document.getElementById('problem-notification');
        const titleElement = document.getElementById('problem-title');
        
        titleElement.innerHTML = `
            <strong>${session.problem_title}</strong><br>
            <small class="text-blue-300">출제자: ${session.teacher_name}</small>
        `;
        notification.classList.remove('hidden');
        
        // 10초 후 자동으로 숨김
        setTimeout(() => {
            this.dismissNotification();
        }, 10000);
    }
    
    dismissNotification() {
        document.getElementById('problem-notification').classList.add('hidden');
    }
    
    async loadCurrentProblem() {
        const problemContent = document.getElementById('problem-content');
        
        if (!this.currentSession) {
            problemContent.innerHTML = `
                <div class="text-center py-12 bg-gray-800 rounded-lg">
                    <i class="fas fa-tasks text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-400">현재 출제된 문제가 없습니다.</p>
                    <p class="text-gray-500 text-sm mt-2">선생님이 문제를 출제하면 여기에 표시됩니다.</p>
                </div>
            `;
            return;
        }
        
        problemContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                <p class="text-gray-400 mt-2">문제를 불러오는 중...</p>
            </div>
        `;
        
        try {
            const response = await fetch(`/api/student/sessions/${this.currentSession.id}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderProblemContent(data.session, data.submissions);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            problemContent.innerHTML = `
                <div class="text-center py-12 bg-gray-800 rounded-lg">
                    <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                    <p class="text-red-400">문제를 불러오는데 실패했습니다.</p>
                    <p class="text-gray-400 text-sm mt-2">${error.message}</p>
                </div>
            `;
        }
    }
    
    renderProblemContent(session, submissions) {
        const problemContent = document.getElementById('problem-content');
        
        problemContent.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6">
                <!-- 문제 정보 -->
                <div class="border-b border-gray-700 pb-6 mb-6">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <h1 class="text-2xl font-bold text-white">${session.title}</h1>
                            <p class="text-gray-400 text-sm mt-1">
                                <i class="fas fa-user-tie mr-1"></i>출제자: ${session.teacher_name}
                            </p>
                        </div>
                        <span class="px-3 py-1 bg-green-900 text-green-300 text-sm rounded">
                            <i class="fas fa-clock mr-1"></i>${session.time_limit}초
                        </span>
                    </div>
                    <h2 class="text-xl text-cyan-400 mb-3">${session.problem_title}</h2>
                    <div class="text-gray-300 whitespace-pre-wrap">${session.problem_description}</div>
                    
                    ${session.expected_output ? `
                        <div class="mt-4 p-4 bg-gray-700 rounded">
                            <h4 class="text-sm font-semibold text-gray-300 mb-2">예상 출력:</h4>
                            <pre class="text-green-300 font-mono text-sm">${session.expected_output}</pre>
                        </div>
                    ` : ''}
                </div>
                
                <!-- 코드 작성 영역 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white">코드 작성</h3>
                        <div class="bg-gray-900 rounded border border-gray-600">
                            <textarea id="problem-code-editor" rows="12" 
                                      class="w-full p-4 bg-gray-900 text-green-300 font-mono text-sm rounded resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                      placeholder="여기에 코드를 작성하세요..."></textarea>
                        </div>
                        
                        <div class="grid grid-cols-1 gap-3">
                            <button onclick="studentEnv.testProblemCode()" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors">
                                <i class="fas fa-play mr-2"></i>테스트 실행 (결과 미리보기)
                            </button>
                            <button onclick="studentEnv.submitProblemCode()" 
                                    class="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded transition-colors">
                                <i class="fas fa-paper-plane mr-2"></i>최종 제출하기
                            </button>
                            <div class="text-xs text-gray-400 text-center">
                                💡 테스트로 먼저 확인한 후 제출하세요
                            </div>
                        </div>
                        
                        <div id="problem-result" class="hidden"></div>
                    </div>
                    
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white">실행 결과</h3>
                        <pre id="problem-output" class="w-full h-64 p-4 bg-gray-900 text-white font-mono text-sm rounded border border-gray-600 overflow-auto">코드를 작성한 후 테스트 실행 버튼을 클릭하세요.</pre>
                        
                        <!-- 내 제출 기록 -->
                        <div>
                            <h4 class="text-md font-semibold text-white mb-3">내 제출 기록</h4>
                            <div class="space-y-2 max-h-48 overflow-y-auto">
                                ${submissions.length > 0 ? submissions.map(sub => `
                                    <div class="p-3 bg-gray-700 rounded border-l-4 ${this.getSubmissionBorderColor(sub.status)}">
                                        <div class="flex justify-between items-start text-sm">
                                            <span class="${this.getSubmissionTextColor(sub.status)}">
                                                ${this.getSubmissionStatusText(sub.status)}
                                            </span>
                                            <span class="text-gray-400">
                                                ${new Date(sub.submitted_at).toLocaleTimeString('ko-KR')}
                                            </span>
                                        </div>
                                        ${sub.output ? `<p class="text-gray-300 text-xs mt-1">출력: ${sub.output}</p>` : ''}
                                        ${sub.error_message ? `<p class="text-red-400 text-xs mt-1">오류: ${sub.error_message}</p>` : ''}
                                    </div>
                                `).join('') : '<p class="text-gray-400 text-sm">아직 제출한 기록이 없습니다.</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async testProblemCode() {
        const code = document.getElementById('problem-code-editor').value;
        const output = document.getElementById('problem-output');
        
        if (!code.trim()) {
            output.textContent = '코드를 먼저 작성해주세요.';
            return;
        }
        
        output.textContent = '코드를 실행 중입니다...';
        
        try {
            let capturedOutput = '';
            this.pyodide.setStdout({ batched: (str) => { capturedOutput += str + '\n'; } });
            this.pyodide.setStderr({ batched: (str) => { capturedOutput += str + '\n'; } });
            
            await this.pyodide.runPythonAsync(code);
            output.textContent = capturedOutput.trim() || '실행이 완료되었습니다. (출력 없음)';
            
        } catch (err) {
            output.textContent = `오류 발생:\n${err.toString()}`;
        } finally {
            this.pyodide.setStdout();
            this.pyodide.setStderr();
        }
    }
    
    async submitProblemCode() {
        const code = document.getElementById('problem-code-editor').value;
        
        if (!code.trim()) {
            this.showSubmitModal('오류', '코드를 먼저 작성해주세요.', 'error');
            return;
        }
        
        // 제출 확인 모달 표시
        this.showSubmitConfirmModal(code);
    }
    
    showSubmitConfirmModal(code) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        modal.innerHTML = `
            <div class="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <h3 class="text-xl font-bold mb-4 text-white">
                    <i class="fas fa-paper-plane text-green-400 mr-2"></i>코드 제출 확인
                </h3>
                <p class="text-gray-300 mb-4">작성한 코드를 제출하시겠습니까?</p>
                <div class="bg-gray-900 p-3 rounded mb-4">
                    <p class="text-green-300 font-mono text-sm">${code.split('\\n').slice(0, 3).join('\\n')}${code.split('\\n').length > 3 ? '\\n...' : ''}</p>
                </div>
                <div class="bg-blue-900 border border-blue-700 p-3 rounded mb-4">
                    <p class="text-blue-200 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        제출하면 선생님이 실시간으로 확인할 수 있습니다.
                    </p>
                </div>
                <div class="flex justify-end gap-3">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">취소</button>
                    <button onclick="studentEnv.confirmSubmitProblemCode('${btoa(encodeURIComponent(code))}'); this.parentElement.parentElement.parentElement.remove();" 
                            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">
                        <i class="fas fa-check mr-2"></i>제출하기
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    async confirmSubmitProblemCode(encodedCode) {
        const code = decodeURIComponent(atob(encodedCode));
        
        try {
            const response = await fetch('/api/student/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    session_id: this.currentSession.id,
                    code: code
                })
            });
            
            const data = await response.json();
            
            const resultDiv = document.getElementById('problem-result');
            resultDiv.classList.remove('hidden');
            
            if (response.ok) {
                this.showSubmitModal('제출 완료!', 
                    `코드가 성공적으로 제출되었습니다.<br>
                     상태: ${this.getSubmissionStatusText(data.status)}<br>
                     ${data.output ? `출력: ${data.output}<br>` : ''}
                     ${data.execution_time ? `실행시간: ${data.execution_time.toFixed(2)}ms` : ''}`, 
                    'success');
                
                // 제출 후 문제 새로고침
                setTimeout(() => this.loadCurrentProblem(), 3000);
            } else {
                this.showSubmitModal('제출 실패', data.error, 'error');
            }
        } catch (error) {
            this.showSubmitModal('오류', '제출 중 오류가 발생했습니다.', 'error');
        }
    }
    
    showSubmitModal(title, message, type) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center';
        
        const iconClass = type === 'success' ? 'fas fa-check-circle text-green-400' : 
                         type === 'error' ? 'fas fa-exclamation-triangle text-red-400' : 
                         'fas fa-info-circle text-blue-400';
        
        const bgClass = type === 'success' ? 'bg-green-800 border-green-600' : 
                       type === 'error' ? 'bg-red-800 border-red-600' : 
                       'bg-blue-800 border-blue-600';
        
        modal.innerHTML = `
            <div class="${bgClass} p-6 rounded-lg shadow-xl border">
                <div class="text-center">
                    <i class="${iconClass} text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold text-white mb-2">${title}</h3>
                    <p class="text-gray-200 mb-4">${message}</p>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded">
                        확인
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 성공 시 3초 후 자동 닫기
        if (type === 'success') {
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    modal.remove();
                }
            }, 3000);
        }
    }
    
    async loadSubmissionHistory() {
        const historyDiv = document.getElementById('submissions-history');
        
        historyDiv.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                <p class="text-gray-400 mt-2">제출 기록을 불러오는 중...</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/student/submissions', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.renderSubmissionHistory(data.submissions);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            historyDiv.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-2xl text-red-400"></i>
                    <p class="text-red-400 mt-2">제출 기록을 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
    
    renderSubmissionHistory(submissions) {
        const historyDiv = document.getElementById('submissions-history');
        
        if (submissions.length === 0) {
            historyDiv.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-history text-4xl text-gray-400"></i>
                    <p class="text-gray-400 mt-4">아직 제출한 기록이 없습니다.</p>
                </div>
            `;
            return;
        }
        
        historyDiv.innerHTML = `
            <div class="space-y-4">
                ${submissions.map(submission => `
                    <div class="bg-gray-700 p-4 rounded-lg border-l-4 ${this.getSubmissionBorderColor(submission.status)}">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h3 class="text-white font-semibold">${submission.session_title}</h3>
                                <p class="text-gray-300 text-sm">${submission.problem_title}</p>
                            </div>
                            <div class="text-right">
                                <div class="flex flex-col items-end gap-2">
                                    <span class="px-2 py-1 ${this.getSubmissionBadgeColor(submission.status)} text-xs rounded">
                                        ${this.getSubmissionStatusText(submission.status)}
                                    </span>
                                    <button onclick="studentEnv.requestDeleteSubmission(${submission.id}, '${submission.problem_title}')" 
                                            class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors duration-200"
                                            title="삭제 요청">
                                        <i class="fas fa-trash-alt mr-1"></i>삭제 요청
                                    </button>
                                    <p class="text-gray-400 text-xs">
                                        ${new Date(submission.submitted_at).toLocaleString('ko-KR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        ${submission.output ? `
                            <div class="mt-3 p-3 bg-gray-800 rounded">
                                <p class="text-gray-400 text-xs mb-1">출력:</p>
                                <pre class="text-green-300 text-sm">${submission.output}</pre>
                            </div>
                        ` : ''}
                        
                        ${submission.error_message ? `
                            <div class="mt-3 p-3 bg-red-900 rounded">
                                <p class="text-red-300 text-xs mb-1">오류:</p>
                                <pre class="text-red-200 text-sm">${submission.error_message}</pre>
                            </div>
                        ` : ''}
                        
                        ${submission.execution_time ? `
                            <p class="text-gray-400 text-xs mt-2">
                                실행시간: ${submission.execution_time.toFixed(2)}ms
                            </p>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
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
    
    getSubmissionTextColor(status) {
        switch (status) {
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            case 'timeout': return 'text-yellow-400';
            default: return 'text-gray-400';
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
    
    logout() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
    
    // 제출 기록 삭제 요청
    requestDeleteSubmission(submissionId, problemTitle) {
        // 모달 생성
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                <div class="p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-400 text-xl mr-3"></i>
                        <h3 class="text-lg font-bold text-white">제출 기록 삭제 요청</h3>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-gray-300 text-sm mb-2">다음 제출 기록의 삭제를 요청하시겠습니까?</p>
                        <div class="bg-gray-700 p-3 rounded border border-gray-600">
                            <p class="text-white font-medium">${problemTitle}</p>
                            <p class="text-gray-400 text-xs">제출 ID: #${submissionId}</p>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-300 mb-2">삭제 사유 (선택사항)</label>
                        <textarea id="delete-reason" 
                                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-white text-sm resize-none"
                                  rows="3"
                                  placeholder="삭제를 요청하는 이유를 입력하세요 (예: 잘못 제출됨, 개인정보 포함 등)"></textarea>
                    </div>
                    
                    <div class="bg-blue-900 border border-blue-700 p-3 rounded mb-6">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-400 mr-2 mt-0.5 text-sm"></i>
                            <div class="text-blue-200 text-xs">
                                <p class="font-semibold mb-1">안내사항:</p>
                                <ul class="list-disc list-inside space-y-1">
                                    <li>삭제 요청은 교사의 승인이 필요합니다</li>
                                    <li>승인 후에는 기록을 복구할 수 없습니다</li>
                                    <li>요청 상태는 제출 기록에서 확인할 수 있습니다</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row gap-3 sm:justify-end">
                        <button onclick="this.closest('.fixed').remove()" 
                                class="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200">
                            취소
                        </button>
                        <button onclick="studentEnv.confirmDeleteRequest(${submissionId})" 
                                class="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200">
                            삭제 요청
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async confirmDeleteRequest(submissionId) {
        const reason = document.getElementById('delete-reason').value;
        const modal = document.querySelector('.fixed');
        
        try {
            const response = await fetch(`/api/student/submissions/${submissionId}/delete-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ reason })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // 성공 모달 표시
                this.showNotificationModal('success', '삭제 요청 완료', data.message);
                
                // 제출 기록 새로고침
                if (document.getElementById('tab-history').classList.contains('bg-cyan-600')) {
                    this.loadSubmissionHistory();
                }
            } else {
                this.showNotificationModal('error', '요청 실패', data.error);
            }
        } catch (error) {
            console.error('Delete request error:', error);
            this.showNotificationModal('error', '오류 발생', '서버 연결에 실패했습니다.');
        }
        
        // 모달 닫기
        if (modal) {
            modal.remove();
        }
    }
    
    showNotificationModal(type, title, message) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4';
        
        const bgColor = type === 'success' ? 'bg-green-900 border-green-700' : 'bg-red-900 border-red-700';
        const iconColor = type === 'success' ? 'text-green-400' : 'text-red-400';
        const textColor = type === 'success' ? 'text-green-200' : 'text-red-200';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle';
        
        modal.innerHTML = `
            <div class="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700">
                <div class="p-6 text-center">
                    <div class="${bgColor} p-3 rounded-lg mb-4 border">
                        <i class="fas ${icon} ${iconColor} text-2xl mb-2"></i>
                        <h3 class="text-lg font-bold text-white">${title}</h3>
                        <p class="${textColor} text-sm mt-1">${message}</p>
                    </div>
                    
                    <button onclick="this.closest('.fixed').remove()" 
                            class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200">
                        확인
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 3초 후 자동 닫기
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
            }
        }, 3000);
    }
}

// 전역 변수로 설정
let studentEnv;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    studentEnv = new StudentEnvironment();
});