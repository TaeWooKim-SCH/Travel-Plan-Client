import { Loader } from '@googlemaps/js-api-loader'
import { config, validateConfig } from './config'

let mapLoader: Loader | null = null
let googleMapsPromise: Promise<any> | null = null

export const getGoogleMaps = async () => {
  if (googleMapsPromise) {
    return googleMapsPromise
  }

  // 환경변수 검증
  if (!config.googleMapsApiKey) {
    throw new Error('Google Maps API 키가 설정되지 않았습니다. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY를 확인하세요.')
  }

  if (!mapLoader) {
    mapLoader = new Loader({
      apiKey: config.googleMapsApiKey,
      version: 'weekly',
      libraries: ['places']
    })
  }

  googleMapsPromise = mapLoader.load()
  return googleMapsPromise
}