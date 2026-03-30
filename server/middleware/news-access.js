import { createError, getRequestURL } from 'h3'
import { assertDashboardAccess } from '../utils/lineFeatureAccess'

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  if (!pathname.startsWith('/api/news')) return
  if (event.node.req.method !== 'GET') return

  const query = getQuery(event)
  const userId = (query.userId ?? '').toString().trim()
  if (!userId) {
    throw createError({ statusCode: 400, statusMessage: 'userId is required' })
  }

  await assertDashboardAccess(userId)
})
