# Cloudflare Pages 빌드 설정 가이드

## 대시보드 설정

### Build Configuration
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (기본값)

### Environment Variables
- **NODE_VERSION**: `18`
- **NPM_VERSION**: `10`

### Build & Deploy 설정
- **Production branch**: `main`
- **Preview deployments**: `All branches`

### 중요사항
- Cloudflare Pages에서는 자동으로 `wrangler pages deploy`가 실행됩니다
- `wrangler deploy`가 아닌 **Pages 전용 배포**가 사용됩니다
- D1 데이터베이스 바인딩은 Pages Dashboard에서 별도 설정 필요

### 수동 배포 명령어
로컬에서 수동 배포 시:
```bash
npm run deploy
# 또는
npm run build && wrangler pages deploy dist
```

### D1 데이터베이스 설정
1. Cloudflare Dashboard → D1 → 데이터베이스 생성
2. Pages Project → Settings → Functions → D1 바인딩 추가
3. 바인딩 이름: `DB`
4. 데이터베이스: 생성된 D1 데이터베이스 선택