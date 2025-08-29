import axios from 'axios'
import { TravelPlan, CreateTravelPlanRequest } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
})

export const getTravelPlans = async (sortBy: 'popular' | 'likes'): Promise<TravelPlan[]> => {
  const response = await api.get(`/travel-plans?sortBy=${sortBy}`)
  return response.data
}

export const getTravelPlan = async (id: string): Promise<TravelPlan> => {
  const response = await api.get(`/travel-plans/${id}`)
  return response.data
}

export const createTravelPlan = async (data: CreateTravelPlanRequest): Promise<TravelPlan> => {
  const response = await api.post('/travel-plans', data)
  return response.data
}