// 환경변수 설정 및 검증
export const config = {
  // API 서버 URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Google Maps API 키
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // 개발 환경 여부
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // 프로덕션 환경 여부
  isProduction: process.env.NODE_ENV === 'production',
}

// 필수 환경변수 검증
export const validateConfig = () => {
  const errors: string[] = []
  
  if (!config.googleMapsApiKey) {
    errors.push('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.')
  }
  
  if (!config.apiUrl) {
    errors.push('NEXT_PUBLIC_API_URL이 설정되지 않았습니다.')
  }
  
  if (errors.length > 0) {
    console.error('환경변수 설정 오류:', errors)
    if (config.isProduction) {
      throw new Error('필수 환경변수가 설정되지 않았습니다: ' + errors.join(', '))
    }
  }
  
  return errors.length === 0
}

// 개발 환경에서만 설정 정보 출력
if (config.isDevelopment) {
  console.log('환경변수 설정:', {
    apiUrl: config.apiUrl,
    googleMapsApiKey: config.googleMapsApiKey ? '설정됨' : '설정되지 않음',
    environment: process.env.NODE_ENV,
  })
}