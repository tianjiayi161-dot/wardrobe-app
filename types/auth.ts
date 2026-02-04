export interface User {
  _id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  emailVerified: boolean
}

export interface Session {
  _id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface RegisterInput {
  email: string
  password: string
  name: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  error?: string
}
