# EunPyeong Python Education - 파이썬 학습 관리 시스템

## 프로젝트 개요
- **이름**: EunPyeong Python Education
- **브랜딩**: 은평메디텍고등학교 - 이은덕 선생님
- **목표**: 교사가 실시간으로 파이썬 문제를 출제하고, 학생들의 코드 실행 결과를 모니터링할 수 있는 학습 관리 시스템
- **연락처**: 
  - 📞 070-4020-6832
  - 📧 deokslife@naver.com
  - 📱 Instagram: https://www.instagram.com/eunpyeong.smtcoding/

## 🌐 접속 정보
- **프로덕션**: https://58ccd62e.python-learning-system.pages.dev
- **GitHub**: https://github.com/AI-Deokslife/PyStudy

## 👥 사용자 역할 및 계정

### 관리자 (Admin)
- **계정**: admin / admin123
- **기능**: 
  - 교사/학생 계정 생성 및 관리
  - 클래스 관리 (생성/수정/삭제)
  - 사용자 관리 테이블에서 클래스 ID 확인
  - 시스템 통계 확인

### 교사별 클래스 담당
- **teacher1 (이은덕)**: `teacher1` / `teacher1`
  - 담당 클래스: **'smt코딩' 클래스만**
  - 제한된 접근: 본인 담당 클래스만 조회/관리 가능
  
- **teacher2 (신선희)**: `teacher2` / `teacher2`
  - 담당 클래스: **나머지 6개 클래스**
  - 권한: 본인 담당 클래스들만 접근 가능

### 교사 공통 기능
- 문제 생성 및 관리 (본인이 생성한 문제만)
- 실시간 문제 세션 시작/종료
- 학생 제출 결과 실시간 모니터링
- 담당 클래스 학생 관리 (추가/제거)
- 교사 프로필 수정 및 비밀번호 변경

### 학생 (Student)  
- **계정**: student1 / student1
- **기능**:
  - 자유 연습 모드 (Pyodide 환경)
  - 교사가 출제한 문제 확인 및 제출
  - 실시간 문제 알림 수신
  - 개인 제출 기록 확인
  - 제출 기록 삭제 요청

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
**teacher1 (smt코딩 클래스 담당)**:
1. teacher1/teacher1로 로그인
2. 클래스 관리 → 'smt코딩' 클래스만 표시됨
3. 문제 관리에서 새 문제 생성
4. 실시간 세션에서 문제 세션 시작
5. 학생 제출 현황을 실시간으로 모니터링
6. 세션 종료

**teacher2 (나머지 클래스 담당)**:  
1. teacher2/teacher2로 로그인
2. 클래스 관리 → 6개 클래스 표시됨
3. 동일한 교사 기능 사용 가능

### 학생 사용법
1. student1/student1로 로그인  
2. 자유 연습 탭에서 파이썬 코드 연습 (CodeMirror + 문법 하이라이팅)
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
- **플랫폼**: ✅ Cloudflare Pages 배포 완료
- **프로덕션 URL**: https://58ccd62e.python-learning-system.pages.dev
- **기술 스택**: Hono + TypeScript + Cloudflare D1
- **마지막 업데이트**: 2025-09-21

## 🔒 보안 및 권한 관리
- **JWT 인증**: verifyAuth 함수로 모든 API 엔드포인트 보안
- **교사별 클래스 접근 제한**: 각 교사는 담당 클래스만 접근 가능
- **클래스 멤버 관리**: 해당 클래스에 속하지 않은 학생만 추가 가능
- **데이터 격리**: 교사간 데이터 완전 분리

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