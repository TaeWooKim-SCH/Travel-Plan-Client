'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createTravelPlan } from '@/lib/api'
import { getGoogleMaps } from '@/lib/googleMaps'
import Header from '@/components/Header'

interface PlaceInfo {
  id: string
  name: string
  address: string
  rating?: number
  types?: string[]
  photos?: any[]
  phoneNumber?: string
  website?: string
  openingHours?: string[]
  priceLevel?: number
}

interface PlaceItem {
  id: string
  marker: any
  info: PlaceInfo
}

interface DayPlan {
  day: number
  places: PlaceItem[]
}



export default function AddPlan() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const [map, setMap] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [participants, setParticipants] = useState(1)
  const [duration, setDuration] = useState(0)
  const [currentDay, setCurrentDay] = useState(1)
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([])
  const [infoWindow, setInfoWindow] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showResults, setShowResults] = useState(false)
  const [placesService, setPlacesService] = useState<any>(null)
  const [editingPlace, setEditingPlace] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)

  // 모달 스크롤 제어
  useEffect(() => {
    if (showResults) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showResults])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }
      setIsAuthenticated(true)
    }
  }, [router])

  useEffect(() => {
    if (step === 2 && isAuthenticated) {
      initMap()
    }
  }, [step, isAuthenticated])

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setDuration(days)
      
      const plans = Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        places: []
      }))
      setDayPlans(plans)
    }
  }, [startDate, endDate])

  const initMap = async () => {
    const google = await getGoogleMaps()
    
    if (mapRef.current) {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 37.5665, lng: 126.9780 },
        zoom: 11,
        clickableIcons: false,
      })

      const infoWindowInstance = new google.maps.InfoWindow()
      setInfoWindow(infoWindowInstance)
      
      const placesService = new google.maps.places.PlacesService(mapInstance)
      setPlacesService(placesService)

      const directionsServiceInstance = new google.maps.DirectionsService()
      const directionsRendererInstance = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#FF6B6B',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })
      
      setDirectionsService(directionsServiceInstance)
      setDirectionsRenderer(directionsRendererInstance)

      mapInstance.addListener('click', (e: any) => {
        if (e.latLng) {
          addMarker(e.latLng, mapInstance, placesService, infoWindowInstance)
        }
      })

      setMap(mapInstance)
    }
  }

  const handleSearch = (query: string) => {
    if (!query.trim() || !placesService) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const request = {
      query: query,
      location: map?.getCenter(),
      radius: 50000,
    }

    placesService.textSearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setSearchResults(results.slice(0, 5))
        setShowResults(true)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    })
  }

  const selectSearchResult = (place: any) => {
    if (place.geometry && place.geometry.location) {
      map?.setCenter(place.geometry.location)
      map?.setZoom(16)
      
      addMarkerFromPlace(place)
      
      setSearchQuery('')
      setSearchResults([])
      setShowResults(false)
    }
  }

  const addMarkerFromPlace = (place: any) => {
    const { Marker } = window.google.maps
    const position = place.geometry.location
    
    const placeId = Date.now().toString()
    const marker = new Marker({
      position,
      map: map,
      title: place.name,
    })

    const placeInfo: PlaceInfo = {
      id: placeId,
      name: place.name || '선택한 장소',
      address: place.formatted_address || '',
      rating: place.rating,
      types: place.types || []
    }

    const placeItem: PlaceItem = { id: placeId, marker, info: placeInfo }
    
    setDayPlans(prev => {
      const newPlans = prev.map(plan => 
        plan.day === currentDay 
          ? { ...plan, places: [...plan.places, placeItem] }
          : plan
      )
      setTimeout(updateRoute, 100)
      return newPlans
    })

    // 즉시 편집 모드로 전환
    setTimeout(() => {
      setEditingPlace(placeId)
      setEditingName(placeInfo.name)
    }, 100)

    marker.addListener('click', () => {
      showLocationInfo(position, placeInfo.address, placesService, infoWindow, map, marker)
    })
  }

  const addMarker = (position: any, mapInstance: any, placesService: any, infoWindowInstance: any) => {
    const { Marker, Geocoder } = window.google.maps
    const geocoder = new Geocoder()
    
    geocoder.geocode({ location: position }, (results: any[] | null, status: any) => {
      let address = '주소 정보 없음'
      if (status === 'OK' && results && results[0]) {
        address = results[0].formatted_address
      }
      
      const placeId = Date.now().toString()
      const marker = new Marker({
        position,
        map: mapInstance,
        title: '선택한 위치',
      })

      const placeInfo: PlaceInfo = {
        id: placeId,
        name: '선택한 위치',
        address: address,
        types: ['point_of_interest']
      }

      const placeItem: PlaceItem = { id: placeId, marker, info: placeInfo }
      
      setDayPlans(prev => {
        const newPlans = prev.map(plan => 
          plan.day === currentDay 
            ? { ...plan, places: [...plan.places, placeItem] }
            : plan
        )
        setTimeout(updateRoute, 100)
        return newPlans
      })

      // 즉시 편집 모드로 전환
      setTimeout(() => {
        setEditingPlace(placeId)
        setEditingName(placeInfo.name)
      }, 100)

      marker.addListener('click', () => {
        showLocationInfo(position, address, placesService, infoWindowInstance, mapInstance, marker)
      })
    })
  }

  const updateRoute = () => {
    const currentDayPlan = dayPlans.find(p => p.day === currentDay)
    if (!currentDayPlan || !directionsService || !directionsRenderer || currentDayPlan.places.length < 2) {
      directionsRenderer?.setDirections({ routes: [] })
      return
    }

    const locations = currentDayPlan.places.map(place => place.marker.getPosition())
    if (locations.length < 2) return

    const origin = locations[0]
    const destination = locations[locations.length - 1]
    const waypoints = locations.slice(1, -1).map(location => ({
      location: location,
      stopover: true
    }))

    directionsService.route({
      origin: origin,
      destination: destination,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    }, (result: any, status: any) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result)
      } else {
        console.log('Directions request failed:', status)
      }
    })
  }

  const showLocationInfo = (position: any, address: string, placesService: any, infoWindowInstance: any, mapInstance: any, marker: any) => {
    const content = `
      <div class="p-3 max-w-sm">
        <h3 class="font-bold text-lg mb-2">선택한 위치</h3>
        <p class="text-gray-600 text-sm mb-3">${address}</p>
        <p class="text-green-600 text-sm font-medium">${currentDay}일차에 추가됨</p>
      </div>
    `
    infoWindowInstance.setContent(content)
    infoWindowInstance.open(mapInstance, marker)
  }



  const updatePlaceName = (dayNumber: number, placeId: string, newName: string) => {
    setDayPlans(prev => 
      prev.map(plan => {
        if (plan.day === dayNumber) {
          return {
            ...plan,
            places: plan.places.map(place => 
              place.id === placeId 
                ? { ...place, info: { ...place.info, name: newName } }
                : place
            )
          }
        }
        return plan
      })
    )
  }

  const startEditing = (placeId: string, currentName: string) => {
    setEditingPlace(placeId)
    setEditingName(currentName)
  }

  const saveEdit = (dayNumber: number, placeId: string) => {
    if (editingName.trim()) {
      updatePlaceName(dayNumber, placeId, editingName.trim())
    }
    setEditingPlace(null)
    setEditingName('')
  }

  const cancelEdit = () => {
    setEditingPlace(null)
    setEditingName('')
  }

  const handleNext = () => {
    if (title && startDate && endDate && participants) {
      setStep(2)
    }
  }

  const removePlace = (dayNumber: number, placeId: string) => {
    setDayPlans(prev => {
      const newPlans = prev.map(plan => {
        if (plan.day === dayNumber) {
          const placeToRemove = plan.places.find(p => p.id === placeId)
          if (placeToRemove) {
            placeToRemove.marker.setMap(null)
          }
          return { ...plan, places: plan.places.filter(p => p.id !== placeId) }
        }
        return plan
      })
      if (dayNumber === currentDay) {
        setTimeout(updateRoute, 100)
      }
      return newPlans
    })
  }

  const handleSubmit = async () => {
    const allPlaces = dayPlans.flatMap(plan => plan.places)
    
    const planData = {
      title,
      startDate,
      endDate,
      participants,
      locations: allPlaces.map((place, index) => ({
        lat: place.marker.getPosition()?.lat(),
        lng: place.marker.getPosition()?.lng(),
        name: place.info.name,
        address: place.info.address,
        order: index + 1,
      })),
    }

    try {
      await createTravelPlan(planData)
      alert('여행 계획이 생성되었습니다!')
    } catch (error) {
      alert('여행 계획 생성에 실패했습니다.')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">✈️</span>
          </div>
          <p className="text-gray-600">로그인이 필요합니다...</p>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md border border-pink-100">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-xl sm:text-2xl">✈️</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">나만의 여행 계획</h2>
            <p className="text-gray-500 text-sm">특별한 여행을 계획해보세요</p>
          </div>
          
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">✨ 여행 제목</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:outline-none transition-colors text-sm sm:text-base"
                placeholder="예: 부산 맛집 투어, 제주도 힐링 여행"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:border-pink-400 focus:outline-none transition-colors text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">📅 종료일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-3 focus:border-pink-400 focus:outline-none transition-colors text-sm"
                  min={startDate}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">👥 인원</label>
              <input
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:outline-none transition-colors text-sm sm:text-base"
                placeholder="몇 명과 함께 하시나요?"
                required
              />
            </div>

            {duration > 0 && (
              <div className="text-center bg-gradient-to-r from-pink-100 to-orange-100 rounded-xl p-3">
                <span className="text-pink-700 font-semibold text-sm sm:text-base">총 {duration}일간의 특별한 여행</span>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!title || !startDate || !endDate || !participants}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:from-pink-600 hover:to-orange-500 disabled:from-gray-300 disabled:to-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              여행 계획 시작하기 🚀
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="h-screen flex flex-col lg:flex-row relative bg-gray-50">
        {/* 모바일 안내 메시지 */}
        <div className="lg:hidden bg-gradient-to-r from-pink-500 to-orange-400 text-white p-3 text-center text-sm">
          📍 지도를 클릭하거나 검색해서 장소를 추가하세요
        </div>
        
        <div ref={mapRef} className="flex-1 h-2/5 lg:h-full" />
      
      {/* 검색바 */}
      <div className="absolute top-16 lg:top-6 left-4 right-4 lg:left-1/2 lg:right-auto lg:transform lg:-translate-x-1/2 z-10 lg:w-96">
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                handleSearch(e.target.value)
              }}
              onFocus={() => searchQuery && setShowResults(true)}
              className="w-full pl-10 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-pink-200 rounded-2xl shadow-xl bg-white focus:outline-none focus:border-pink-400 transition-all duration-200 text-gray-700 placeholder-gray-400 text-sm lg:text-base"
              placeholder="어디로 떠나고 싶으세요? 🔍"
            />
            <div className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-pink-400">
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border-2 border-pink-100 rounded-2xl shadow-2xl mt-2 max-h-60 overflow-y-auto z-20">
              {searchResults.map((place, index) => (
                <div
                  key={index}
                  onClick={() => selectSearchResult(place)}
                  className="p-3 lg:p-4 hover:bg-pink-50 cursor-pointer border-b border-pink-50 last:border-b-0 transition-colors"
                >
                  <h4 className="font-semibold text-sm text-gray-800">{place.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">{place.formatted_address}</p>
                  {place.rating && (
                    <p className="text-xs text-orange-500 mt-1">⭐ {place.rating}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="w-full lg:w-80 h-3/5 lg:h-full bg-white shadow-2xl overflow-y-auto border-t lg:border-t-0 lg:border-l border-pink-100">
        <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-4 lg:p-6 text-white">
          <h2 className="text-lg lg:text-xl font-bold mb-2">{title}</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs lg:text-sm opacity-90">
            <span>📅 {startDate} ~ {endDate}</span>
            <span>👥 {participants}명</span>
          </div>
          <div className="mt-2 text-xs lg:text-sm opacity-90">
            {duration}일간의 여행
          </div>
        </div>

        <div className="p-3 lg:p-4 border-b border-pink-100">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dayPlans.map((plan) => (
              <button
                key={plan.day}
                onClick={() => {
                  setCurrentDay(plan.day)
                  setTimeout(updateRoute, 100)
                }}
                className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  currentDay === plan.day
                    ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white shadow-lg'
                    : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                }`}
              >
                {plan.day}일차
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-3 lg:p-4">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="font-bold text-gray-800 text-sm lg:text-base">{currentDay}일차 일정</h3>
            <span className="bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full font-semibold">
              {dayPlans.find(p => p.day === currentDay)?.places.length || 0}개
            </span>
          </div>
          
          <div className="space-y-2 lg:space-y-3 max-h-96 overflow-y-auto">
            {dayPlans.find(p => p.day === currentDay)?.places.map((place, index) => (
              <div key={place.id} className="border-2 border-pink-100 rounded-xl lg:rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                {editingPlace === place.id ? (
                  <div className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                      <span className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-semibold">{index + 1}</span>
                      <span className="text-xs text-pink-600 font-medium">✨ 장소 이름을 입력하세요</span>
                    </div>
                    <div className="mb-2 lg:mb-3">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full text-sm border-2 border-pink-200 rounded-xl px-3 lg:px-4 py-2 lg:py-3 focus:outline-none focus:border-pink-400 transition-colors"
                        placeholder="예: 맛있는 점심, 힐링 카페"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveEdit(currentDay, place.id)
                          } else if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-2">
                      <p className="text-xs text-gray-500 line-clamp-2 lg:flex-1 lg:mr-3">{place.info.address}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(currentDay, place.id)}
                          className="flex-1 lg:flex-none bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-3 py-2 rounded-lg hover:from-green-600 hover:to-green-700 font-semibold transition-all"
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 lg:flex-none bg-gray-400 text-white text-xs px-3 py-2 rounded-lg hover:bg-gray-500 font-semibold transition-all"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 lg:p-4 relative">
                    <button
                      onClick={() => removePlace(currentDay, place.id)}
                      className="absolute top-2 lg:top-3 right-2 lg:right-3 text-pink-400 hover:text-pink-600 w-6 h-6 lg:w-7 lg:h-7 flex items-center justify-center rounded-full hover:bg-pink-50 transition-all"
                    >
                      <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="pr-8 lg:pr-10">
                      <div className="flex items-center gap-2 lg:gap-3 mb-1 lg:mb-2">
                        <span className="bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-semibold">{index + 1}</span>
                        <h4 
                          className="font-semibold text-gray-800 cursor-pointer hover:text-pink-600 flex-1 transition-colors text-sm lg:text-base line-clamp-1"
                          onClick={() => startEditing(place.id, place.info.name)}
                          title="클릭하여 이름 수정"
                        >
                          {place.info.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-500 ml-6 lg:ml-7 line-clamp-2">{place.info.address}</p>
                    </div>
                  </div>
                )}
              </div>
            )) || (
              <div className="text-center py-8 lg:py-12">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-pink-100 to-orange-100 rounded-full mx-auto mb-3 lg:mb-4 flex items-center justify-center">
                  <span className="text-2xl lg:text-3xl">📍</span>
                </div>
                <p className="text-gray-600 font-medium mb-2 text-sm lg:text-base">아직 계획된 장소가 없어요</p>
                <p className="text-gray-400 text-xs lg:text-sm mb-1">지도를 클릭하거나 검색해서</p>
                <p className="text-gray-400 text-xs lg:text-sm">특별한 장소를 추가해보세요! ✨</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 lg:p-4 border-t border-pink-100 space-y-2 lg:space-y-3">
          <button
            onClick={() => setStep(1)}
            className="w-full bg-gray-100 text-gray-600 py-2 lg:py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm lg:text-base"
          >
            ← 이전 단계
          </button>
          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 lg:py-4 rounded-xl font-bold text-sm lg:text-lg hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🎉 여행 계획 완성하기
          </button>
        </div>
      </div>
      </div>
    </>
  )
}