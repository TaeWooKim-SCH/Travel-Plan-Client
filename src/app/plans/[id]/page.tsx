'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { getTravelPlan } from '@/lib/api'
import { TravelPlan } from '@/types'
import Header from '@/components/Header'
import { getGoogleMaps } from '@/lib/googleMaps'

interface RouteVisualizationModalProps {
  plan: TravelPlan
  onClose: () => void
}

function RouteVisualizationModal({ plan, onClose }: RouteVisualizationModalProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [google, setGoogle] = useState<any>(null)
  const [currentDay, setCurrentDay] = useState(1)

  const groupLocationsByDay = () => {
    if (!plan.locations || plan.locations.length === 0) return []
    const locationsPerDay = Math.ceil(plan.locations.length / plan.duration)
    const dayGroups: any[] = []
    
    for (let day = 1; day <= plan.duration; day++) {
      const startIndex = (day - 1) * locationsPerDay
      const endIndex = Math.min(startIndex + locationsPerDay, plan.locations.length)
      const dayLocations = plan.locations.slice(startIndex, endIndex)
      
      if (dayLocations.length > 0) {
        dayGroups.push({
          day,
          locations: dayLocations.sort((a, b) => a.order - b.order)
        })
      }
    }
    
    return dayGroups
  }

  const initMap = async () => {
    if (!mapRef.current || !plan.locations || plan.locations.length === 0) return

    const googleInstance = await getGoogleMaps()
    setGoogle(googleInstance)
    
    const firstLocation = plan.locations[0]
    const mapInstance = new googleInstance.maps.Map(mapRef.current, {
      center: { lat: firstLocation.lat, lng: firstLocation.lng },
      zoom: 12
    })

    const directionsServiceInstance = new googleInstance.maps.DirectionsService()
    const directionsRendererInstance = new googleInstance.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#FF6B6B',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    })

    setMap(mapInstance)
    setDirectionsService(directionsServiceInstance)
    setDirectionsRenderer(directionsRendererInstance)
  }

  const [markers, setMarkers] = useState<any[]>([])
  const [polyline, setPolyline] = useState<any>(null)

  const clearMarkers = () => {
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])
    if (polyline) {
      polyline.setMap(null)
      setPolyline(null)
    }
  }

  const updateRoute = (day: number) => {
    if (!map || !google) return

    // 기존 마커와 선 제거
    clearMarkers()

    const dayGroups = groupLocationsByDay()
    const dayGroup = dayGroups.find(g => g.day === day)
    
    if (!dayGroup || dayGroup.locations.length === 0) {
      return
    }

    // 마커 생성
    const newMarkers = dayGroup.locations.map((location: any, index: any) => {
      return new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        label: (index + 1).toString()
      })
    })
    setMarkers(newMarkers)

    // 2개 이상일 때 직선으로 연결
    if (dayGroup.locations.length >= 2) {
      const path = dayGroup.locations.map((location: any) => ({
        lat: location.lat,
        lng: location.lng
      }))

      const newPolyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#FF6B6B',
        strokeOpacity: 1.0,
        strokeWeight: 3
      })

      newPolyline.setMap(map)
      setPolyline(newPolyline)
    }
  }

  useEffect(() => {
    initMap()
  }, [])

  useEffect(() => {
    if (map && directionsRenderer && directionsService && google) {
      updateRoute(currentDay)
    }
  }, [currentDay, map, directionsRenderer, directionsService, google])

  const dayGroups = groupLocationsByDay()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">🗺️ 여행 경로 시각화</h3>
            <p className="text-gray-600 mt-1">일차별 선으로 연결된 여행 경로</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-3 lg:p-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {dayGroups.map((dayGroup) => (
              <button
                key={dayGroup.day}
                onClick={() => setCurrentDay(dayGroup.day)}
                className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                  currentDay === dayGroup.day
                    ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {dayGroup.day}일차 ({dayGroup.locations.length}개)
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div ref={mapRef} className="w-full h-full" />
        </div>
        
        <div className="bg-white p-4 lg:p-6 border-t border-gray-200 rounded-b-2xl lg:rounded-b-3xl flex-shrink-0">
          <div className="grid grid-cols-3 gap-3 lg:gap-4">
            <div className="text-center">
              <div className="text-xl lg:text-2xl mb-1 lg:mb-2">📍</div>
              <div className="text-xs lg:text-sm text-gray-600">{currentDay}일차 장소</div>
              <div className="font-bold text-sm lg:text-lg">{dayGroups.find(g => g.day === currentDay)?.locations.length || 0}개</div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🚗</div>
              <div className="text-xs lg:text-sm text-gray-600">이동 방식</div>
              <div className="font-bold text-sm lg:text-lg">자동차</div>
            </div>
            <div className="text-center">
              <div className="text-xl lg:text-2xl mb-1 lg:mb-2">🗺️</div>
              <div className="text-xs lg:text-sm text-gray-600">경로 타입</div>
              <div className="font-bold text-sm lg:text-lg">일차별</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      { id: '1', name: '해운대 해수욕장', lat: 35.1587, lng: 129.1603, order: 1, address: '부산광역시 해운대구 우동 1394' },
      { id: '2', name: '광안리 해수욕장', lat: 35.1532, lng: 129.1186, order: 2, address: '부산광역시 수영구 광안동 219' }
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
      { id: '3', name: '성산일출봉', lat: 33.4584, lng: 126.9427, order: 1, address: '제주특별자치도 서귀포시 성산읍 성산리 1' },
      { id: '4', name: '한라산', lat: 33.3617, lng: 126.5292, order: 2, address: '제주특별자치도 제주시 제주대학로 102' }
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
      { id: '5', name: '홍대 거리', lat: 37.5563, lng: 126.9236, order: 1, address: '서울특별시 마포구 연남동 188-5' },
      { id: '6', name: '한강공원', lat: 37.5326, lng: 126.9652, order: 2, address: '서울특별시 영등포구 여의도동 330' }
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
      { id: '7', name: '불국사', lat: 35.7898, lng: 129.3320, order: 1, address: '경상북도 경주시 진현동 15-1' },
      { id: '8', name: '석굴암', lat: 35.7948, lng: 129.3469, order: 2, address: '경상북도 경주시 진현동 891' }
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
      { id: '9', name: '정동진', lat: 37.6907, lng: 129.0348, order: 1, address: '강원도 강릉시 강동면 정동진리 17' },
      { id: '10', name: '안목해변', lat: 37.7719, lng: 128.9479, order: 2, address: '강원도 강릉시 송정동 안목항길 20' }
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
      { id: '11', name: '전주 한옥마을', lat: 35.8150, lng: 127.1530, order: 1, address: '전라북도 전주시 완산구 교동 기린대로 99' }
    ]
  }
]

export default function PlanDetail() {
  const params = useParams()
  const [plan, setPlan] = useState<TravelPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [showRouteModal, setShowRouteModal] = useState(false)

  // 모달 스크롤 제어
  useEffect(() => {
    if (showMapModal || showRouteModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMapModal, showRouteModal])
  
  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
  }
  
  const openMapModal = (location: any) => {
    setSelectedLocation(location)
    setShowMapModal(true)
  }
  
  const closeMapModal = () => {
    setShowMapModal(false)
    setSelectedLocation(null)
  }
  
  const showDayRouteVisualization = () => {
    if (!plan?.locations || plan.locations.length === 0) {
      alert('표시할 장소가 없습니다.')
      return
    }
    setShowRouteModal(true)
  }
  
  const closeRouteModal = () => {
    setShowRouteModal(false)
  }

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        // 먼저 API에서 데이터 찾기
        const data = await getTravelPlan(params.id as string)
        setPlan(data)
      } catch (error) {
        console.error('API에서 여행 계획을 찾을 수 없습니다. 더미 데이터에서 찾는 중...', error)
        
        // API에서 실패하면 더미 데이터에서 찾기
        const dummyPlan = dummyPlans.find(plan => plan.id === params.id)
        if (dummyPlan) {
          setPlan(dummyPlan)
        }
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPlan()
    }
  }, [params.id])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse">
              <span className="text-2xl">✈️</span>
            </div>
            <p className="text-gray-600">여행 계획을 불러오는 중...</p>
          </div>
        </div>
      </>
    )
  }

  if (!plan) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-3xl">🗺️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">여행 계획을 찾을 수 없어요</h2>
            <p className="text-gray-600">다른 멋진 여행 계획들을 둘러보세요!</p>
          </div>
        </div>
      </>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getBudgetEstimate = (participants: number, duration: number) => {
    const baseAmount = 150000 // 1인당 1일 기본 예산
    return (baseAmount * participants * duration).toLocaleString()
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
        {/* 히어로 섹션 */}
        <section className="relative bg-gradient-to-r from-pink-500 via-pink-600 to-orange-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 lg:px-4 py-2 mb-4 lg:mb-6">
                  <span className="text-xs lg:text-sm font-medium">✨ 특별한 여행</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-4 lg:mb-6 leading-tight">{plan.title}</h1>
                <p className="text-sm sm:text-base lg:text-xl opacity-90 mb-6 lg:mb-8 leading-relaxed">{plan.description}</p>
                
                <div className="grid grid-cols-2 gap-3 lg:gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 lg:p-4">
                    <div className="text-xl lg:text-3xl mb-2">📅</div>
                    <div className="text-xs lg:text-sm opacity-80">여행 기간</div>
                    <div className="font-bold text-sm lg:text-lg">{plan.duration}일</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 lg:p-4">
                    <div className="text-xl lg:text-3xl mb-2">👥</div>
                    <div className="text-xs lg:text-sm opacity-80">참가자</div>
                    <div className="font-bold text-sm lg:text-lg">{plan.participants}명</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 lg:p-8">
                <h3 className="text-lg lg:text-2xl font-bold mb-4 lg:mb-6">여행 정보</h3>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="opacity-80 text-sm lg:text-base">출발일</span>
                    <span className="font-semibold text-sm lg:text-base">{formatDate(plan.startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80 text-sm lg:text-base">도착일</span>
                    <span className="font-semibold text-sm lg:text-base">{formatDate(plan.endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80 text-sm lg:text-base">예상 예산</span>
                    <span className="font-semibold text-sm lg:text-base">{getBudgetEstimate(plan.participants, plan.duration)}원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-80 text-sm lg:text-base">좋아요</span>
                    <span className="font-semibold flex items-center gap-1 text-sm lg:text-base">
                      ❤️ {plan.likes}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 lg:mt-8 flex gap-3">
                  <button className="flex-1 bg-white text-pink-600 py-2 lg:py-3 rounded-xl font-semibold hover:bg-pink-50 transition-colors text-sm lg:text-base">
                    💾 저장하기
                  </button>
                  <button className="flex-1 bg-pink-600 text-white py-2 lg:py-3 rounded-xl font-semibold hover:bg-pink-700 transition-colors text-sm lg:text-base">
                    📤 공유하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 여행 일정 */}
        <main className="max-w-7xl mx-auto px-4 py-8 lg:py-16">
          {plan.locations && plan.locations.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* 일정 목록 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl shadow-xl p-4 lg:p-8 border border-pink-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-3">
                    <h2 className="text-xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 lg:gap-3">
                      🗺️ 여행 일정
                    </h2>
                    <div className="bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 px-3 lg:px-4 py-2 rounded-full text-xs lg:text-sm font-semibold">
                      총 {plan.locations.length}개 장소
                    </div>
                  </div>
                  
                  <div className="space-y-4 lg:space-y-6">
                    {plan.locations.map((location, index) => (
                      <div key={location.id || index} className="group relative">
                        {/* 연결선 */}
                        {plan.locations && index < plan.locations.length - 1 && (
                          <div className="absolute left-4 lg:left-6 top-12 lg:top-16 w-0.5 h-8 lg:h-12 bg-gradient-to-b from-pink-300 to-orange-300"></div>
                        )}
                        
                        <div 
                          className="flex gap-3 lg:gap-6 p-4 lg:p-6 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl border border-pink-100 hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02] cursor-pointer"
                          onClick={() => openMapModal(location)}
                        >
                          <div className="bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-full w-8 h-8 lg:w-12 lg:h-12 flex items-center justify-center font-bold text-sm lg:text-lg flex-shrink-0 shadow-lg">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2 lg:mb-3">
                              <h3 className="text-base lg:text-xl font-bold text-gray-800 pr-2">
                                {location.name || `장소 ${index + 1}`}
                              </h3>
                              <div className="flex gap-2">
                                <span className="bg-white/80 text-pink-600 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                  📍 {index + 1}번째
                                </span>
                              </div>
                            </div>
                            
                            {(location as any).address && (
                              <div className="bg-white/60 rounded-lg p-2 lg:p-3 mb-3 lg:mb-4">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                  📍 주소
                                </div>
                                <div className="text-xs lg:text-sm font-medium text-gray-700 leading-relaxed">
                                  {(location as any).address}
                                </div>
                              </div>
                            )}
                            
                            {location.description && (
                              <p className="text-gray-600 bg-white/60 rounded-lg p-2 lg:p-3 text-xs lg:text-sm leading-relaxed">
                                {location.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-2 mt-3 lg:mt-4">
                              <button 
                                className="text-xs bg-blue-100 text-blue-700 px-2 lg:px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openMapModal(location)
                                }}
                              >
                                🗺️ 지도에서 보기
                              </button>
                              <button 
                                className="text-xs bg-green-100 text-green-700 px-2 lg:px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(`https://www.google.com/maps/dir//${location.lat},${location.lng}`, '_blank')
                                }}
                              >
                                📱 여기로 가기
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 사이드바 정보 */}
              <div className="space-y-4 lg:space-y-6">
                {/* 경로 시각화 */}
                <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl shadow-lg p-4 lg:p-6 border border-orange-200">
                  <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-3 lg:mb-4 flex items-center gap-2">
                    📏 경로 시각화
                  </h3>
                  <button
                    onClick={showDayRouteVisualization}
                    className="w-full bg-orange-500 text-white py-2 lg:py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    🗺️ 일차별 경로 보기
                  </button>
                  <div className="text-xs text-gray-600 bg-white/60 rounded-lg p-2 lg:p-3 mt-3">
                    <span>일차별로 장소들을 직선으로 연결하여 경로를 시각화합니다</span>
                  </div>
                </div>
                
                {/* 여행 팁 */}
                <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 border border-pink-100">
                  <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-3 lg:mb-4 flex items-center gap-2">
                    💡 여행 팁
                  </h3>
                  <div className="space-y-2 lg:space-y-3 text-xs lg:text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">•</span>
                      <span>각 장소별 충분한 이동 시간을 고려하세요</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">•</span>
                      <span>현지 날씨를 미리 확인해보세요</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-pink-500">•</span>
                      <span>예약이 필요한 장소는 미리 확인하세요</span>
                    </div>
                  </div>
                </div>
                
                {/* 준비물 체크리스트 */}
                <div className="bg-white rounded-2xl shadow-lg p-4 lg:p-6 border border-pink-100">
                  <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-3 lg:mb-4 flex items-center gap-2">
                    ✅ 준비물 체크리스트
                  </h3>
                  <div className="space-y-1 lg:space-y-2 text-xs lg:text-sm">
                    {['여권/신분증', '카메라', '충전기', '편한 신발', '간식', '물'].map((item, idx) => (
                      <label key={idx} className="flex items-center gap-2 cursor-pointer hover:bg-pink-50 p-2 rounded-lg transition-colors">
                        <input type="checkbox" className="text-pink-500 rounded" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* 날씨 정보 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-4 lg:p-6 border border-blue-200">
                  <h3 className="text-base lg:text-lg font-bold text-gray-800 mb-3 lg:mb-4 flex items-center gap-2">
                    🌤️ 예상 날씨
                  </h3>
                  <div className="text-center">
                    <div className="text-2xl lg:text-3xl mb-2">☀️</div>
                    <div className="text-base lg:text-lg font-semibold text-gray-800">맑음</div>
                    <div className="text-xs lg:text-sm text-gray-600">최고 23°C / 최저 15°C</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 lg:py-20">
              <div className="w-20 h-20 lg:w-32 lg:h-32 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mx-auto mb-6 lg:mb-8 flex items-center justify-center">
                <span className="text-4xl lg:text-6xl">📍</span>
              </div>
              <h3 className="text-xl lg:text-3xl font-bold text-gray-800 mb-3 lg:mb-4">
                아직 여행 일정이 없어요
              </h3>
              <p className="text-gray-600 text-sm lg:text-lg mb-6 lg:mb-8 px-4">
                이 여행 계획에는 아직 구체적인 일정이 추가되지 않았어요
              </p>
              <button className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-semibold hover:from-pink-600 hover:to-orange-500 transition-all text-sm lg:text-base">
                일정 추가하기
              </button>
            </div>
          )}
        </main>
        
        {/* 지도 모달 */}
        {showMapModal && selectedLocation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 lg:p-4">
            <div className="bg-white rounded-2xl lg:rounded-3xl w-full max-w-4xl h-[90vh] lg:h-[80vh] shadow-2xl flex flex-col">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
                <div className="flex-1 pr-4">
                  <h3 className="text-lg lg:text-2xl font-bold text-gray-800 truncate">{selectedLocation.name}</h3>
                  {(selectedLocation as any).address && (
                    <p className="text-gray-600 mt-1 text-sm lg:text-base truncate">{(selectedLocation as any).address}</p>
                  )}
                </div>
                <button
                  onClick={closeMapModal}
                  className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5 lg:w-6 lg:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 지도 영역 */}
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${selectedLocation.lat},${selectedLocation.lng}&zoom=16`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              
              {/* 모달 하단 버튼 */}
              <div className="bg-white p-4 lg:p-6 border-t border-gray-200 rounded-b-2xl lg:rounded-b-3xl flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => window.open(`https://maps.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}`, '_blank')}
                    className="flex-1 bg-blue-500 text-white py-2 lg:py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    🗺️ Google Maps에서 열기
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${selectedLocation.lat}, ${selectedLocation.lng}`)
                      alert('좌표가 복사되었습니다!')
                    }}
                    className="flex-1 bg-gray-500 text-white py-2 lg:py-3 rounded-xl font-semibold hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm lg:text-base"
                  >
                    📋 좌표 복사
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 경로 시각화 모달 */}
        {showRouteModal && plan.locations && plan.locations.length > 0 && (
          <RouteVisualizationModal 
            plan={plan} 
            onClose={closeRouteModal}
          />
        )}

      </div>
    </>
  )
}