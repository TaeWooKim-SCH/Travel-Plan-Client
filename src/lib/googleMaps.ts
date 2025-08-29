import { Loader } from '@googlemaps/js-api-loader'

let mapLoader: Loader | null = null
let googleMapsPromise: Promise<any> | null = null

export const getGoogleMaps = async () => {
  if (googleMapsPromise) {
    return googleMapsPromise
  }

  if (!mapLoader) {
    mapLoader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places']
    })
  }

  googleMapsPromise = mapLoader.load()
  return googleMapsPromise
}