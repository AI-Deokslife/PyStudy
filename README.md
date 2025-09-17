# 파이썬 학습 관리 플랫폼

## 프로젝트 개요
- **이름**: Python Learning Management System
- **목표**: 교사가 실시간으로 파이썬 문제를 출제하고, 학생들의 코드 실행 결과를 모니터링할 수 있는 학습 관리 시스템
- **기반**: 은평메디텍고등학교 이은덕 선생님의 파이썬 코드 연습장을 확장

## 🌐 접속 정보
- **개발 서버**: https://3000-i3a4otlz37gjylpzbv4em-6532622b.e2b.dev
- **GitHub**: (별도 설정 필요)

## 👥 사용자 역할 및 계정

### 관리자 (Admin)
- **계정**: admin / admin123
- **기능**: 
  - 교사/학생 계정 생성 및 관리
  - 엑셀 파일을 통한 대량 계정 생성
  - 시스템 통계 확인

### 교사 (Teacher)
- **계정**: teacher1 / teacher123  
- **기능**:
  - 문제 생성 및 관리
  - 실시간 문제 세션 시작/종료
  - 학생 제출 결과 실시간 모니터링
  - 클래스별 학생 진도 관리

### 학생 (Student)  
- **계정**: student1, student2, student3 / student123
- **기능**:
  - 자유 연습 모드 (기존 Pyodide 환경)
  - 교사가 출제한 문제 확인 및 제출
  - 실시간 문제 알림 수신
  - 개인 제출 기록 확인

## 🏗️ 시스템 아키텍처

### 백엔드 (Hono + Cloudflare)
- **프레임워크**: Hono (Edge Runtime)
- **데이터베이스**: Cloudflare D1 (SQLite)
- **인증**: JWT 기반 토큰 인증
- **API 구조**:
  - `/api/auth` - 로그인/인증
  - `/api/admin` - 관리자 기능
  - `/api/teacher` - 교사 기능  
  - `/api/student` - 학생 기능

### 프론트엔드
- **UI**: Vanilla JavaScript + Tailwind CSS
- **코드 에디터**: CodeMirror (문법 하이라이팅)
- **파이썬 실행**: Pyodide (WebAssembly)
- **실시간 업데이트**: 폴링 방식 (5초 간격)

### 데이터 모델
- **users** - 사용자 정보 (관리자/교사/학생)
- **classes** - 클래스 정보
- **problems** - 문제 정보
- **problem_sessions** - 실시간 문제 세션
- **submissions** - 학생 제출 기록

## 🚀 핵심 기능

### ✅ 구현 완료된 기능

1. **사용자 관리 시스템**
   - 역할 기반 접근 제어 (Admin/Teacher/Student)
   - JWT 토큰 기반 인증
   - 개별 계정 생성
   - CSV 파일을 통한 대량 계정 생성

2. **실시간 문제 출제 시스템**
   - 교사가 문제를 실시간으로 출제
   - 학생에게 자동 알림 (폴링 방식)
   - 세션 기반 문제 관리 (시작/종료)

3. **파이썬 코드 실행 환경**
   - Pyodide 기반 브라우저 내 파이썬 실행
   - CodeMirror 문법 하이라이팅
   - input() 함수 지원 (JavaScript prompt)
   - 파일 저장/불러오기 기능

4. **코드 제출 및 모니터링**
   - 학생 코드 실시간 제출
   - 교사의 실시간 제출 현황 모니터링
   - 실행 결과 및 오류 추적
   - 제출 기록 관리

5. **관리자 대시보드**
   - 사용자 목록 및 관리
   - 엑셀 파일 업로드를 통한 계정 생성
   - 시스템 통계 (사용자 수, 역할별 분포)

6. **교사 대시보드**  
   - 문제 생성 및 관리
   - 실시간 세션 관리
   - 학생 제출 현황 실시간 모니터링
   - 3초 간격 자동 업데이트

7. **학생 학습 환경**
   - 3개 탭: 자유 연습 / 출제된 문제 / 제출 기록
   - 실시간 문제 알림 (팝업)
   - 세션 상태 표시기
   - 문제별 제출 기록 관리

## 📊 데이터 흐름

1. **관리자** → 계정 생성 → **교사/학생**
2. **교사** → 문제 생성 → **문제 은행**
3. **교사** → 세션 시작 → **활성 세션**
4. **학생** → 폴링 → **세션 감지** → **문제 확인**
5. **학생** → 코드 제출 → **제출 기록**
6. **교사** → 실시간 모니터링 → **제출 현황**

## 🛠️ 개발 환경 설정

### 로컬 개발
```bash
# 의존성 설치
npm install

# 데이터베이스 마이그레이션
npm run db:migrate:local
npm run db:seed

# 빌드
npm run build  

# 개발 서버 시작 (PM2)
pm2 start ecosystem.config.cjs

# 또는 직접 실행
npm run dev:d1
```

### 주요 스크립트
- `npm run build` - Vite 빌드
- `npm run dev:d1` - D1 데이터베이스와 함께 로컬 개발 서버
- `npm run db:migrate:local` - 로컬 DB 마이그레이션
- `npm run db:seed` - 테스트 데이터 삽입
- `npm run db:reset` - DB 초기화 및 재설정

## 🎯 사용 가이드

### 관리자 사용법
1. admin/admin123로 로그인
2. 사용자 관리에서 교사/학생 계정 생성
3. 엑셀 파일로 대량 계정 생성 (CSV 형식)
   - 필수 컬럼: username, password, full_name, role
   - 선택 컬럼: email, class_id

### 교사 사용법  
1. teacher1/teacher123로 로그인
2. 문제 관리에서 새 문제 생성
3. 실시간 세션에서 문제 세션 시작
4. 학생 제출 현황을 실시간으로 모니터링
5. 세션 종료

### 학생 사용법
1. student1/student123로 로그인  
2. 자유 연습 탭에서 파이썬 코드 연습
3. 새 문제 알림 시 "출제된 문제" 탭으로 이동
4. 문제 확인 후 코드 작성 및 제출
5. 제출 기록 탭에서 이전 결과 확인

## 🔧 기술 스택

- **Backend**: Hono, TypeScript, Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript, Tailwind CSS
- **Code Editor**: CodeMirror 5.65.16
- **Python Runtime**: Pyodide 0.25.1 (WebAssembly)
- **Process Manager**: PM2
- **Build Tool**: Vite

## 📝 배포 상태
- **플랫폼**: Cloudflare Pages (배포 예정)
- **현재 상태**: ✅ 로컬 개발 완료
- **기술 스택**: Hono + TypeScript + Cloudflare D1
- **마지막 업데이트**: 2025-09-17

## 🔄 향후 개선 계획

1. **보안 강화**
   - 실제 비밀번호 해싱 (bcrypt)
   - HTTPS 적용
   - 입력 데이터 검증 강화

2. **기능 확장**
   - 테스트 케이스 자동 검증
   - 코드 유사성 검사
   - 실시간 채팅 기능
   - 과제 제출 기한 설정

3. **UI/UX 개선**
   - 반응형 디자인 개선  
   - 다크 모드 지원
   - 진도율 시각화
   - 알림 시스템 개선

4. **성능 최적화**
   - 데이터베이스 인덱스 최적화
   - 캐싱 시스템 도입
   - 무한 스크롤 구현

## 📞 문의
- 원본 제작자: 은평메디텍고등학교 이은덕 선생님
- 시스템 확장: AI 개발 어시스턴트