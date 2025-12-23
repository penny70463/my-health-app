// utils/treeConfig.js

// Helper 函數：根據樹種 ID 生成階段圖片路徑
const generateStages = (treeId) => {
  return [1, 2, 3, 4].map(stage => `/images/tree-stages/${treeId}/${stage}.png`)
}

export const TREE_DATA = {
    // ID 必須對應資料庫儲存的字串
    apple: {
      id: 'apple',
      name: '幸福蘋果樹',
      description: '象徵平安與健康，每天一顆蘋果醫生遠離我。',
      color: 'text-red-500', // 文字顏色
      // 階段圖片路徑 (請確保您有準備這些圖片，或先用現有的擋著)
      get stages() {
        return generateStages(this.id)
      }
    },
    cherry: {
      id: 'cherry',
      name: '夢幻櫻花樹',
      description: '粉紅色的浪漫，象徵純潔與高尚的心。',
      color: 'text-pink-500',
      get stages() {
        return generateStages(this.id)
      }
    },
    orange: {
      id: 'orange',
      name: '大吉大利橘',
      description: '金黃色的果實，象徵財運滾滾與吉利。',
      color: 'text-orange-500',
      get stages() {
        return generateStages(this.id)
      }
    }
  }
  
  // 隨機抽選一顆新樹 (排除目前的樹，避免連續種一樣的)
  export const getRandomTreeId = (currentId) => {
    const keys = Object.keys(TREE_DATA)
    // 如果只有一種樹，就只能回傳那一種
    if (keys.length === 1) return keys[0]
    
    // 過濾掉現在這棵，從剩下的隨機選
    const candidates = keys.filter(k => k !== currentId)
    const randomIndex = Math.floor(Math.random() * candidates.length)
    return candidates[randomIndex]
  }