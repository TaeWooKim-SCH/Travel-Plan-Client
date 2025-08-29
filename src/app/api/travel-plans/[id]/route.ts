import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${BACKEND_URL}/travel-plans/${params.id}`)
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Backend API error:', error)
    return NextResponse.json({ error: 'Failed to fetch travel plan' }, { status: 500 })
  }
}