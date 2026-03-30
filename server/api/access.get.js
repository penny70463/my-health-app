import { fetchUserFeatureFlags } from '../utils/lineFeatureAccess'

export default defineEventHandler(async (event) => {
  const userId = getQuery(event).userId?.trim?.() || ''

  if (!userId) {
    return { chat: false, dashboard: false }
  }

  const flags = await fetchUserFeatureFlags(userId)
  return {
    chat: flags.chat,
    dashboard: flags.dashboard,
  }
})
