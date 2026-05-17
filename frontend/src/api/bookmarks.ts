import client from './client'

export interface Bookmark {
  id: number
  verse_key: string
  surah_number: number
  ayah_number: number
  surah_name: string | null
  verse_text: string | null
  qf_bookmark_id: string | null
  created_at: string
}

export const addBookmark = (data: {
  verse_key: string
  surah_number: number
  ayah_number: number
  surah_name?: string
  verse_text?: string
}) => client.post<Bookmark>('/bookmarks', data).then(r => r.data)

export const listBookmarks = () =>
  client.get<Bookmark[]>('/bookmarks').then(r => r.data)

export const deleteBookmark = (id: number) =>
  client.delete(`/bookmarks/${id}`)
