import axios from 'axios'
import { TravelPlan, CreateTravelPlanRequest } from '@/types'
import { config } from './config'

const api = axios.create({
  baseURL: config.apiUrl,
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