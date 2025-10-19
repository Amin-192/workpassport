const CACHE_KEY_PREFIX = 'github_data_cache_'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 
interface CachedData {
  data: any
  timestamp: number
  walletAddress: string
}

export function getCachedGitHubData(walletAddress: string) {
  if (typeof window === 'undefined') return null
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${walletAddress.toLowerCase()}`
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null
    
    const parsedCache: CachedData = JSON.parse(cached)
    
    // Check if cache is expired
    const now = Date.now()
    if (now - parsedCache.timestamp > CACHE_DURATION) {
      localStorage.removeItem(cacheKey)
      return null
    }
    
    return parsedCache.data
  } catch (error) {
    console.error('Error reading cache:', error)
    return null
  }
}

export function setCachedGitHubData(walletAddress: string, data: any) {
  if (typeof window === 'undefined') return
  
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${walletAddress.toLowerCase()}`
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
      walletAddress: walletAddress.toLowerCase()
    }
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error setting cache:', error)
  }
}

export function clearGitHubCache(walletAddress: string) {
  if (typeof window === 'undefined') return
  const cacheKey = `${CACHE_KEY_PREFIX}${walletAddress.toLowerCase()}`
  localStorage.removeItem(cacheKey)
}