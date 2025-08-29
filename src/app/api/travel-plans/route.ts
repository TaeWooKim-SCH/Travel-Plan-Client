import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sortBy = searchParams.get('sortBy') || 'popular'
  
  try {
    const response = await fetch(`${BACKEND_URL}/travel-plans?sortBy=${sortBy}`)
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Backend API error:', error)
    return NextResponse.json({ error: 'Failed to fetch travel plans' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${BACKEND_URL}/travel-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Backend API error:', error)
    return NextResponse.json({ error: 'Failed to create travel plan' }, { status: 500 })
  }
}