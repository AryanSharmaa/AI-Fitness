// Graceful degradation if Redis is not configured
let redisClient: any = null

async function getRedis() {
  if (!process.env.REDIS_URL) return null
  if (redisClient) return redisClient
  try {
    const { default: Redis } = await import('ioredis')
    redisClient = new Redis(process.env.REDIS_URL)
    return redisClient
  } catch {
    return null
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedis()
  if (!redis) return null
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds = 3600): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    await redis.setex(key, ttlSeconds, value)
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedis()
  if (!redis) return
  try {
    await redis.del(key)
  } catch {}
}
