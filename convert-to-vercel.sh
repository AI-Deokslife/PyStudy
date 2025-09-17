#!/bin/bash
echo "🔄 Vercel용 프로젝트 변환 스크립트"
echo "=================================="

# 1. Vercel 프로젝트 디렉토리 생성
mkdir -p ../webapp-vercel
cd ../webapp-vercel

# 2. 기본 구조 생성
mkdir -p api/auth api/admin api/teacher api/student
mkdir -p public/static
mkdir -p lib

# 3. 정적 파일 복사
cp -r ../webapp/public/* ./public/
cp -r ../webapp/dist/* ./public/ 2>/dev/null || true

# 4. Vercel 설정 파일 생성
cat > vercel.json << 'VERCEL_CONFIG'
{
  "version": 2,
  "builds": [
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    },
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
VERCEL_CONFIG

# 5. Package.json 생성
cat > package.json << 'PKG'
{
  "name": "python-learning-vercel",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.38.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  }
}
PKG

echo "✅ Vercel 프로젝트 구조 생성 완료!"
echo "📁 위치: ../webapp-vercel"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase 계정 생성 (database)"
echo "2. API 함수들을 Vercel 형식으로 변환"
echo "3. vercel deploy 명령어로 배포"
