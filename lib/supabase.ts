import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          currency: string
          table_count: number
          staff_pin: string
          plan: 'starter' | 'pro' | 'enterprise'
          active: boolean
          created_at: string
          primary_color: string
          address: string | null
          phone: string | null
        }
      }
      menu_categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          emoji: string
          sort_order: number
        }
      }
      menu_items: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string
          name: string
          description: string | null
          price: number
          available: boolean
          sort_order: number
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          table_number: number
          guest_name: string
          items: OrderItem[]
          status: 'pending' | 'preparing' | 'served' | 'paid'
          total: number
          created_at: string
          notes: string | null
        }
      }
      waiter_calls: {
        Row: {
          id: string
          restaurant_id: string
          table_number: number
          guest_name: string
          created_at: string
          resolved: boolean
        }
      }
    }
  }
}

export type OrderItem = {
  id: string
  name: string
  price: number
  emoji: string
  quantity: number
}
