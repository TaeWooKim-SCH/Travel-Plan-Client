# Travel Plans Client

## 환경 변수 설정

### 로컬 개발
1. `.env.example`을 복사하여 `.env.local` 생성
2. 실제 값으로 변경:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=실제_구글맵_API_키
   ```

### Vercel 배포
Vercel 대시보드에서 환경 변수 설정:
- `NEXT_PUBLIC_API_URL`: EC2 서버 URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API 키

## 실행
```bash
npm install
npm run dev
```

## 빌드
```bash
npm run build
```