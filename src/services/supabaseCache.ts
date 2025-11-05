import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CACHE_TABLE = 'nba_data_cache';
const CACHE_DURATION_MS = 5 * 60 * 1000;

export interface CacheEntry {
  id?: string;
  key: string;
  data: any;
  created_at?: string;
  updated_at?: string;
}

async function ensureCacheTableExists(): Promise<void> {
  try {
    const { error } = await supabase
      .from(CACHE_TABLE)
      .select('id')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('Cache table does not exist. It will be created via migration.');
    }
  } catch (error) {
    console.error('Error checking cache table:', error);
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    await ensureCacheTableExists();

    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Error fetching cached data:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    const now = new Date().getTime();
    const cacheTime = new Date(data.updated_at || data.created_at).getTime();

    if (now - cacheTime > CACHE_DURATION_MS) {
      await supabase.from(CACHE_TABLE).delete().eq('key', key);
      return null;
    }

    return data.data as T;
  } catch (error) {
    console.error('Error in getCachedData:', error);
    return null;
  }
}

export async function setCachedData(key: string, data: any): Promise<void> {
  try {
    await ensureCacheTableExists();

    const { error: deleteError } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .eq('key', key);

    if (deleteError) {
      console.error('Error deleting old cache:', deleteError);
    }

    const { error: insertError } = await supabase
      .from(CACHE_TABLE)
      .insert({
        key,
        data,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error setting cached data:', insertError);
    }
  } catch (error) {
    console.error('Error in setCachedData:', error);
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    await ensureCacheTableExists();

    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error clearing cache:', error);
    }
  } catch (error) {
    console.error('Error in clearAllCache:', error);
  }
}
