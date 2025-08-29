export interface TravelPlan {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  duration: number
  participants: number
  likes: number
  locations?: Location[]
  createdAt: string
  updatedAt: string
}

export interface Location {
  id?: string
  name?: string
  lat: number
  lng: number
  order: number
  description?: string
  address?: string
}

export interface CreateTravelPlanRequest {
  title: string
  startDate: string
  endDate: string
  participants: number
  locations: Omit<Location, 'id'>[]
}