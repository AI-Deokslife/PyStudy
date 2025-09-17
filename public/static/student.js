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
            <header class="bg-gray-800 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between items-center h-16">
                        <div class="flex items-center">
                            <i class="fas fa-user-graduate text-2xl text-green-400 mr-3"></i>
                            <h1 class="text-xl font-semibold text-white">파이썬 학습 환경</h1>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div id="session-indicator" class="flex items-center">
                                <div class="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                                <span class="text-gray-400 text-sm">세션 확인 중...</span>
                            </div>
                            <span class="text-gray-300">${this.user.full_name} (${this.user.class_id || '클래스 미지정'})</span>
                            <button onclick="studentEnv.logout()" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white">
                                <i class="fas fa-sign-out-alt mr-2"></i>로그아웃
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
            <div id="problem-notification" class="hidden fixed top-20 right-4 bg-blue-900 border border-blue-700 p-4 rounded-lg shadow-xl z-40 max-w-sm">
                <div class="flex items-start">
                    <i class="fas fa-exclamation-circle text-blue-400 text-xl mr-3 mt-1"></i>
                    <div class="flex-1">
                        <h4 class="text-blue-300 font-semibold">새로운 문제가 출제되었습니다!</h4>
                        <p id="problem-title" class="text-blue-200 text-sm mt-1"></p>
                        <div class="mt-3 space-x-2">
                            <button onclick="studentEnv.loadCurrentProblem()" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-white text-sm">
                                문제 보기
                            </button>
                            <button onclick="studentEnv.dismissNotification()" class="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-white text-sm">
                                나중에
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="container mx-auto p-4 max-w-7xl">
                <!-- 탭 네비게이션 -->
                <div class="flex mb-6 bg-gray-800 rounded-lg p-2">
                    <button id="tab-practice" onclick="studentEnv.switchTab('practice')" 
                            class="flex-1 py-2 px-4 text-center rounded bg-cyan-600 text-white font-semibold">
                        <i class="fas fa-code mr-2"></i>자유 연습
                    </button>
                    <button id="tab-problem" onclick="studentEnv.switchTab('problem')" 
                            class="flex-1 py-2 px-4 text-center rounded text-gray-300 hover:bg-gray-700">
                        <i class="fas fa-tasks mr-2"></i>출제된 문제
                    </button>
                    <button id="tab-history" onclick="studentEnv.switchTab('history')" 
                            class="flex-1 py-2 px-4 text-center rounded text-gray-300 hover:bg-gray-700">
                        <i class="fas fa-history mr-2"></i>제출 기록
                    </button>
                </div>

                <!-- 자유 연습 탭 -->
                <div id="practice-tab" class="tab-content">
                    <div class="flex flex-col lg:flex-row gap-6 min-h-[75vh]">
                        <!-- 왼쪽 섹션: 코드 에디터 -->
                        <div class="lg:w-1/2 flex flex-col bg-gray-800 rounded-lg shadow-lg">
                            <div class="flex-1 flex flex-col">
                                <div class="p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                                    <h2 class="text-lg font-semibold text-white">코딩 영역</h2>
                                </div>
                                <textarea id="code-editor" class="w-full flex-1 p-4 bg-gray-900 text-green-300 font-mono text-base rounded-b-lg focus:outline-none resize-none" spellcheck="false"></textarea>
                            </div>
                            <div class="p-3 bg-gray-700 rounded-b-lg border-t border-gray-500 flex flex-col gap-3">
                                <div class="flex gap-3">
                                    <button id="run-btn" disabled class="w-1/3 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        <i class="fas fa-play mr-2"></i>코드 실행
                                    </button>
                                    <button id="clear-code-btn" class="w-1/3 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-eraser mr-2"></i>코드 삭제
                                    </button>
                                    <button id="clear-output-btn" class="w-1/3 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-trash mr-2"></i>결과 삭제
                                    </button>
                                </div>
                                <div class="flex gap-3">
                                    <button id="save-file-btn" class="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-save mr-2"></i>파일로 저장
                                    </button>
                                    <button id="load-file-btn" class="w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition duration-300">
                                        <i class="fas fa-folder-open mr-2"></i>파일 불러오기
                                    </button>
                                </div>
                                <span id="status-message" class="text-center text-sm text-gray-400 h-4 transition-opacity duration-500 opacity-0"></span>
                            </div>
                        </div>

                        <!-- 오른쪽 섹션: 입력 및 결과 -->
                        <div class="lg:w-1/2 flex flex-col">
                            <div class="flex flex-col bg-gray-800 rounded-lg shadow-lg h-full">
                                <div class="p-3 bg-gray-700 rounded-t-lg border-b border-gray-600">
                                    <h2 class="text-lg font-semibold text-white">실행 결과</h2>
                                </div>
                                <pre id="output" class="w-full flex-1 p-4 bg-gray-900 text-white font-mono text-base rounded-b-lg overflow-auto whitespace-pre-wrap break-words">결과는 여기에 표시됩니다.</pre>
                            </div>
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
        // 기본 버튼 이벤트
        document.getElementById('run-btn').addEventListener('click', () => this.runPythonCode());
        document.getElementById('clear-output-btn').addEventListener('click', () => this.clearOutput());
        document.getElementById('clear-code-btn').addEventListener('click', () => this.clearCode());
        document.getElementById('save-file-btn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('load-file-btn').addEventListener('click', () => this.loadFile());
        
        // 파일 처리
        document.getElementById('file-loader').addEventListener('change', (e) => this.handleFileLoad(e));
        
        // 모달 이벤트
        document.getElementById('cancel-save-btn').addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirm-save-btn').addEventListener('click', () => this.saveFile());
        document.getElementById('filename-input').addEventListener('keypress', (e) => {
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
            document.getElementById('run-btn').disabled = false;
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
            this.pyodide.setStdout({ batched: (str) => { capturedOutput += str + '\\n'; } });
            this.pyodide.setStderr({ batched: (str) => { capturedOutput += str + '\\n'; } });
            
            await this.pyodide.runPythonAsync(code);
            this.showOutput(capturedOutput.trim() || '실행이 완료되었습니다. (출력 없음)');
            
        } catch (err) {
            this.showOutput(`오류 발생:\\n${err.toString()}`);
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
        
        titleElement.textContent = session.problem_title;
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
                        <h1 class="text-2xl font-bold text-white">${session.title}</h1>
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
                                      placeholder="여기에 코드를 작성하세요...">${session.initial_code || ''}</textarea>
                        </div>
                        
                        <div class="flex gap-3">
                            <button onclick="studentEnv.testProblemCode()" 
                                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded">
                                <i class="fas fa-play mr-2"></i>테스트 실행
                            </button>
                            <button onclick="studentEnv.submitProblemCode()" 
                                    class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded">
                                <i class="fas fa-paper-plane mr-2"></i>제출하기
                            </button>
                        </div>
                        
                        <div id="problem-result" class="hidden"></div>
                    </div>
                    
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-white">실행 결과</h3>
                        <pre id="problem-output" class="w-full h-64 p-4 bg-gray-900 text-white font-mono text-sm rounded border border-gray-600 overflow-auto">테스트 실행 버튼을 클릭하여 코드를 확인해보세요.</pre>
                        
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
            this.pyodide.setStdout({ batched: (str) => { capturedOutput += str + '\\n'; } });
            this.pyodide.setStderr({ batched: (str) => { capturedOutput += str + '\\n'; } });
            
            await this.pyodide.runPythonAsync(code);
            output.textContent = capturedOutput.trim() || '실행이 완료되었습니다. (출력 없음)';
            
        } catch (err) {
            output.textContent = `오류 발생:\\n${err.toString()}`;
        } finally {
            this.pyodide.setStdout();
            this.pyodide.setStderr();
        }
    }
    
    async submitProblemCode() {
        const code = document.getElementById('problem-code-editor').value;
        
        if (!code.trim()) {
            alert('코드를 먼저 작성해주세요.');
            return;
        }
        
        if (!confirm('정말로 제출하시겠습니까?')) {
            return;
        }
        
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
                resultDiv.innerHTML = `
                    <div class="p-4 bg-green-900 border border-green-700 rounded text-green-300">
                        <i class="fas fa-check-circle mr-2"></i>제출이 완료되었습니다!
                        <div class="mt-2 text-sm">
                            <p>상태: ${this.getSubmissionStatusText(data.status)}</p>
                            ${data.output ? `<p>출력: ${data.output}</p>` : ''}
                            ${data.execution_time ? `<p>실행시간: ${data.execution_time.toFixed(2)}ms</p>` : ''}
                        </div>
                    </div>
                `;
                
                // 제출 후 문제 새로고침
                setTimeout(() => this.loadCurrentProblem(), 2000);
            } else {
                resultDiv.innerHTML = `
                    <div class="p-4 bg-red-900 border border-red-700 rounded text-red-300">
                        <i class="fas fa-exclamation-triangle mr-2"></i>${data.error}
                    </div>
                `;
            }
        } catch (error) {
            const resultDiv = document.getElementById('problem-result');
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="p-4 bg-red-900 border border-red-700 rounded text-red-300">
                    <i class="fas fa-exclamation-triangle mr-2"></i>제출 중 오류가 발생했습니다.
                </div>
            `;
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
                                <span class="px-2 py-1 ${this.getSubmissionBadgeColor(submission.status)} text-xs rounded">
                                    ${this.getSubmissionStatusText(submission.status)}
                                </span>
                                <p class="text-gray-400 text-xs mt-1">
                                    ${new Date(submission.submitted_at).toLocaleString('ko-KR')}
                                </p>
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
}

// 전역 변수로 설정
let studentEnv;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    studentEnv = new StudentEnvironment();
});