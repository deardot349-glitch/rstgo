import { createClient } from '@supabase/supabase-js'

// Used ONLY for Storage (photo uploads) — database is Firebase
export const supabaseStorage = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function uploadMenuItemImage(
  restaurantId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop()
  const fileName = `${restaurantId}/menu/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabaseStorage.storage
    .from('restaurant-images')
    .upload(fileName, file, { upsert: true })

  if (error) throw error

  const { data } = supabaseStorage.storage
    .from('restaurant-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

export async function deleteMenuItemImage(url: string): Promise<void> {
  try {
    // Extract path after the bucket name
    const path = url.split('/restaurant-images/')[1]
    if (!path) return
    await supabaseStorage.storage.from('restaurant-images').remove([path])
  } catch {
    // ignore if already deleted
  }
}
