'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getTravelPlans } from '@/lib/api'
import { TravelPlan } from '@/types'
import Header from '@/components/Header'

// 더미 데이터
const dummyPlans: TravelPlan[] = [
  {
    id: '1',
    title: '부산 맛집 투어 🦐',
    description: '해운대부터 광안리까지, 부산의 숨은 맛집들을 찾아 떠나는 미식 여행',
    startDate: '2024-03-15',
    endDate: '2024-03-17',
    duration: 3,
    participants: 2,
    likes: 127,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    locations: [
      { id: '1', name: '해운대 해수욕장', lat: 35.1587, lng: 129.1603, order: 1 },
      { id: '2', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, order: 2 }
    ]
  },
  {
    id: '2',
    title: '제주도 힐링 여행 🌺',
    description: '성산일출봉과 한라산, 제주의 자연을 만끽하는 3박 4일 힐링 여행',
    startDate: '2024-04-01',
    endDate: '2024-04-04',
    duration: 4,
    participants: 4,
    likes: 89,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    locations: [
      { id: '3', name: '성산일출봉', lat: 33.4584, lng: 126.9427, order: 1 },
      { id: '4', name: '한라산', lat: 33.3617, lng: 126.5292, order: 2 }
    ]
  },
  {
    id: '3',
    title: '서울 데이트 코스 💕',
    description: '홍대부터 강남까지, 연인과 함께하는 로맨틱 서울 투어',
    startDate: '2024-02-14',
    endDate: '2024-02-14',
    duration: 1,
    participants: 2,
    likes: 156,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-10',
    locations: [
      { id: '5', name: '홍대 거리', lat: 37.5563, lng: 126.9236, order: 1 },
      { id: '6', name: '한강공원', lat: 37.5326, lng: 126.9652, order: 2 }
    ]
  },
  {
    id: '4',
    title: '경주 역사 탐방 🏛️',
    description: '불국사와 석굴암, 천년 고도 경주의 역사를 따라가는 문화 여행',
    startDate: '2024-05-01',
    endDate: '2024-05-03',
    duration: 3,
    participants: 3,
    likes: 73,
    createdAt: '2024-01-25',
    updatedAt: '2024-01-25',
    locations: [
      { id: '7', name: '불국사', lat: 35.7898, lng: 129.3320, order: 1 },
      { id: '8', name: '석굴암', lat: 35.7948, lng: 129.3469, order: 2 }
    ]
  },
  {
    id: '5',
    title: '강릉 바다 여행 🌊',
    description: '정동진 일출과 안목해변 커피, 강릉의 바다를 만끽하는 여행',
    startDate: '2024-06-15',
    endDate: '2024-06-16',
    duration: 2,
    participants: 5,
    likes: 94,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
    locations: [
      { id: '9', name: '정동진', lat: 37.6907, lng: 129.0348, order: 1 },
      { id: '10', name: '안목해변', lat: 37.7719, lng: 128.9479, order: 2 }
    ]
  },
  {
    id: '6',
    title: '전주 한옥마을 체험 🏘️',
    description: '한옥마을에서 즐기는 전통 문화 체험과 전주 비빔밥 맛집 투어',
    startDate: '2024-03-20',
    endDate: '2024-03-21',
    duration: 2,
    participants: 6,
    likes: 112,
    createdAt: '2024-01-30',
    updatedAt: '2024-01-30',
    locations: [
      { id: '11', name: '전주 한옥마을', lat: 35.8150, lng: 127.1530, order: 1 }
    ]
  }
]

export default function Home() {
  const [plans, setPlans] = useState<TravelPlan[]>(dummyPlans)
  const [sortBy, setSortBy] = useState<'popular' | 'likes'>('popular')

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiData = await getTravelPlans(sortBy)
        // 실제 데이터와 더미 데이터 합치기
        const combinedPlans = [...apiData, ...dummyPlans]
        
        // 정렬
        const sortedPlans = combinedPlans.sort((a, b) => {
          if (sortBy === 'likes') {
            return b.likes - a.likes
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        
        setPlans(sortedPlans)
      } catch (error) {
        console.error('여행 계획을 불러오는데 실패했습니다:', error)
        // API 실패 시 더미 데이터만 사용
        const sortedPlans = [...dummyPlans].sort((a, b) => {
          if (sortBy === 'likes') {
            return b.likes - a.likes
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setPlans(sortedPlans)
      }
    }
    
    fetchPlans()
  }, [sortBy])

  const getLocationText = (locations: any[]) => {
    if (!locations || locations.length === 0) return ''
    if (locations.length === 1) return locations[0].name
    return `${locations[0].name} 외 ${locations.length - 1}곳`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      <Header />

      {/* 히어로 섹션 */}
      <section className="max-w-7xl mx-auto px-4 py-8 lg:py-12 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 lg:mb-4">
          어디로 떠나고 싶으세요? 🌍
        </h2>
        <p className="text-sm sm:text-base lg:text-xl text-gray-600 mb-6 lg:mb-8 px-4">
          다른 여행자들의 특별한 여행 계획을 둘러보고, 영감을 받아보세요
        </p>
        
        {/* 정렬 버튼 */}
        <div className="flex justify-center gap-2 lg:gap-3 mb-8 lg:mb-12">
          <button
            onClick={() => setSortBy('popular')}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 text-sm lg:text-base ${
              sortBy === 'popular'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-pink-200 hover:border-pink-300'
            }`}
          >
            🔥 인기순
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`px-4 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl font-semibold transition-all duration-200 text-sm lg:text-base ${
              sortBy === 'likes'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-pink-200 hover:border-pink-300'
            }`}
          >
            ❤️ 좋아요순
          </button>
        </div>
      </section>

      {/* 여행 계획 카드 그리드 */}
      <main className="max-w-7xl mx-auto px-4 pb-12 lg:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/plans/${plan.id}`}>
              <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-pink-100 hover:border-pink-200 group cursor-pointer">
                {/* 카드 헤더 */}
                <div className="h-40 lg:h-48 bg-gradient-to-br from-pink-400 via-pink-500 to-orange-400 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute bottom-3 lg:bottom-4 left-3 lg:left-4 right-3 lg:right-4 text-white">
                    <h3 className="text-lg lg:text-xl font-bold mb-2 group-hover:scale-105 transition-transform line-clamp-2">
                      {plan.title}
                    </h3>
                    <div className="flex items-center gap-3 lg:gap-4 text-xs lg:text-sm opacity-90">
                      <span className="flex items-center gap-1">
                        📅 {plan.duration}일
                      </span>
                      <span className="flex items-center gap-1">
                        👥 {plan.participants}명
                      </span>
                    </div>
                  </div>
                  {/* 좋아요 배지 */}
                  <div className="absolute top-3 lg:top-4 right-3 lg:right-4 bg-white/20 backdrop-blur-sm rounded-full px-2 lg:px-3 py-1 text-white text-xs lg:text-sm font-semibold">
                    ❤️ {plan.likes}
                  </div>
                </div>

                {/* 카드 내용 */}
                <div className="p-4 lg:p-6">
                  <p className="text-gray-600 mb-3 lg:mb-4 line-clamp-2 leading-relaxed text-sm lg:text-base">
                    {plan.description}
                  </p>
                  
                  {/* 여행지 정보 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                      <span>📍</span>
                      <span className="truncate">{getLocationText(plan.locations || [])}</span>
                    </div>
                    <div className="text-xs text-gray-400 flex-shrink-0">
                      {new Date(plan.startDate).toLocaleDateString('ko-KR', { 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>

                  {/* 호버 시 나타나는 버튼 */}
                  <div className="mt-3 lg:mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-center py-2 rounded-xl font-semibold text-sm lg:text-base">
                      여행 계획 보기 →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 빈 상태 */}
        {plans.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-4xl">🗺️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              아직 여행 계획이 없어요
            </h3>
            <p className="text-gray-600 mb-8">
              첫 번째 여행 계획을 만들어보세요!
            </p>
            <Link
              href="/plans/add"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white px-8 py-4 rounded-2xl font-semibold hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>✨</span>
              여행 계획 만들기
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}