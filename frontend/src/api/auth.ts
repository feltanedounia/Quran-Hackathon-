import client from './client'

export const register = (data: { email: string; username: string; password: string; gender: string }) =>
  client.post('/auth/register', data).then(r => r.data)

export const login = (data: { email: string; password: string }) =>
  client.post('/auth/login', data).then(r => r.data)

export const getMe = () =>
  client.get('/auth/me').then(r => r.data)

export const updateMe = (data: { bio?: string; country?: string; current_hifd?: string }) =>
  client.put('/auth/me', data).then(r => r.data)

export const uploadPhoto = (file: File) => {
  const form = new FormData()
  form.append('photo', file)
  return client.post('/auth/me/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}
