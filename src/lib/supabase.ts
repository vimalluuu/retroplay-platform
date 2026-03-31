import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Only create client if keys are available
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

// ── Database helpers ─────────────────────────────────────────────────────────

export type SupabaseUser = {
  id: string
  email: string
  user_metadata: {
    username?: string
    avatar_url?: string
  }
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

export async function signUp(email: string, password: string, username: string) {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return
  return supabase.auth.signOut()
}

// ── Cloud game metadata (optional) ──────────────────────────────────────────

export async function fetchCloudGames() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('Error fetching cloud games:', error)
    return []
  }
  return data || []
}

export async function saveGameMetadata(game: {
  title: string
  console: string
  description?: string
  thumbnail_url?: string
  year?: number
  genre?: string[]
  user_id: string
}) {
  if (!supabase) return null
  const { data, error } = await supabase.from('games').insert(game).select().single()
  if (error) throw error
  return data
}

export async function saveFavorite(userId: string, gameId: string) {
  if (!supabase) return
  await supabase.from('favorites').upsert({ user_id: userId, game_id: gameId })
}

export async function removeFavorite(userId: string, gameId: string) {
  if (!supabase) return
  await supabase.from('favorites').delete().match({ user_id: userId, game_id: gameId })
}

export async function fetchFavorites(userId: string) {
  if (!supabase) return []
  const { data } = await supabase
    .from('favorites')
    .select('game_id')
    .eq('user_id', userId)
  return (data || []).map((f: { game_id: string }) => f.game_id)
}
