import client from './client'
import type { User } from '../types'

export const register = (data: {
  email: string; username: string; password: string; gender: 'male' | 'female'
}) => client.post<{ access_token: string; token_type: string }>('/auth/register', data).then(r => r.data)

export const login = (data: { email: string; password: string }) =>
  client.post<{ access_token: string; token_type: string }>('/auth/login', data).then(r => r.data)

export const getMe = () => client.get<User>('/auth/me').then(r => r.data)

export const updateMe = (data: Partial<Pick<User, 'bio' | 'country' | 'current_hifd'>>) =>
  client.put<User>('/auth/me', data).then(r => r.data)
