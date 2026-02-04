import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register']

// API routes that don't require authentication
const publicApiRoutes = ['/api/auth/login', '/api/auth/register']

// Verify JWT token directly in middleware (avoid importing db)
function verifyToken(token: string): { userId: string } | null {
  try {
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables')
      return null
    }
    return jwt.verify(token, JWT_SECRET) as { userId: string }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Allow public routes
    if (publicRoutes.includes(pathname) || publicApiRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Get token from cookie or Authorization header
    const token = request.cookies.get('auth-token')?.value ||
                  request.headers.get('authorization')?.replace('Bearer ', '')

    // Check if accessing protected route
    if (!token) {
      // Redirect to login for protected pages
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add userId to headers for API routes to access
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to login
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|public|icon-).*)',
  ],
}
