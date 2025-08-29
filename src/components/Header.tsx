'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      if (token && userData) {
        setUser(JSON.parse(userData))
      }
    }
  }, [])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const body = authMode === 'login' 
        ? { email, password }
        : { email, password, name }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.access_token)
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        setUser(data.user)
        setShowAuthModal(false)
        setEmail('')
        setPassword('')
        setName('')
      } else {
        alert(data.message || '오류가 발생했습니다.')
      }
    } catch (error) {
      alert('서버 연결에 실패했습니다.')
    }
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setUser(null)
    router.push('/')
  }

  const handlePlanCreate = () => {
    if (!user) {
      setShowAuthModal(true)
      setAuthMode('login')
    } else {
      router.push('/plans/add')
    }
  }

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-pink-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 lg:py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 lg:gap-3">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
                <span className="text-lg lg:text-xl">✈️</span>
              </div>
              <div>
                <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-500 bg-clip-text text-transparent">
                  여행어때
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">나만의 특별한 여행을 계획해보세요</p>
              </div>
            </Link>

            <div className="flex items-center gap-2 lg:gap-4">
              <button
                onClick={handlePlanCreate}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white px-3 lg:px-6 py-2 lg:py-3 rounded-xl lg:rounded-2xl font-semibold hover:from-pink-600 hover:to-orange-500 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-1 lg:gap-2 text-sm lg:text-base"
              >
                <span>✨</span>
                <span className="hidden sm:inline">여행 계획 만들기</span>
                <span className="sm:hidden">계획 만들기</span>
              </button>

              {user ? (
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-gray-700 font-medium text-sm lg:text-base hidden sm:inline">{user.name}님</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-800 px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm lg:text-base"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 lg:gap-2">
                  <button
                    onClick={() => {
                      setAuthMode('login')
                      setShowAuthModal(true)
                    }}
                    className="text-gray-600 hover:text-gray-800 px-2 lg:px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm lg:text-base"
                  >
                    로그인
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register')
                      setShowAuthModal(true)
                    }}
                    className="bg-white text-pink-600 border-2 border-pink-200 px-2 lg:px-4 py-2 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors font-medium text-sm lg:text-base"
                  >
                    회원가입
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 인증 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {authMode === 'login' ? '로그인' : '회원가입'}
              </h2>
              <p className="text-gray-600">
                {authMode === 'login' 
                  ? '여행 계획을 만들고 공유해보세요' 
                  : '새로운 여행의 시작을 함께해요'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:outline-none transition-colors"
                    placeholder="이름을 입력하세요"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:outline-none transition-colors"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-pink-400 focus:outline-none transition-colors"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-orange-500 transition-all"
                >
                  {authMode === 'login' ? '로그인' : '회원가입'}
                </button>
              </div>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-pink-600 hover:text-pink-700 font-medium"
              >
                {authMode === 'login' 
                  ? '계정이 없으신가요? 회원가입' 
                  : '이미 계정이 있으신가요? 로그인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}