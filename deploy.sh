#!/bin/bash
echo "🚀 파이썬 학습 관리 시스템 배포 스크립트"
echo "============================================"

# 1. 인증 확인
echo "1️⃣ Cloudflare 인증 확인 중..."
npx wrangler whoami

# 2. 프로젝트 생성 (이미 있으면 스킵됨)
echo "2️⃣ Cloudflare Pages 프로젝트 생성 중..."
npx wrangler pages project create python-learning-system --production-branch main --compatibility-date 2024-01-01 || echo "프로젝트가 이미 존재합니다."

# 3. 빌드
echo "3️⃣ 프로젝트 빌드 중..."
npm run build

# 4. 배포
echo "4️⃣ Cloudflare Pages에 배포 중..."
npx wrangler pages deploy dist --project-name python-learning-system

echo "✅ 배포 완료!"
echo "📱 배포된 URL을 확인해주세요."
