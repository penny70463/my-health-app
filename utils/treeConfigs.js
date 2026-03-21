// utils/treeConfig.js

// Helper 函數：根據樹種 ID 生成階段圖片路徑
const generateStages = (treeId) => {
  return [1, 2, 3, 4].map(stage => `/images/tree-stages/${treeId}/${stage}.png`)
}

export const ITEM_DATA = {
    // ID 必須對應資料庫儲存的字串
    apple: {
      id: 'apple',
      type: 'plant',
      name: '幸福蘋果樹',
      description: '象徵平安與健康，每天一顆蘋果醫生遠離我。',
      color: 'text-red-500', // 文字顏色
      type: 'plant',
      actions: { water: '澆水', leg: '鬆土' },
      get stages() {
        return generateStages(this.id)
      }
    },
    cherry: {
      id: 'cherry',
      type: 'plant',
      name: '夢幻櫻花樹',
      description: '粉紅色的浪漫，象徵純潔與高尚的心。',
      color: 'text-pink-500',
      type: 'plant',
      actions: { water: '澆水', leg: '修剪枝葉' },
      get stages() {
        return generateStages(this.id)
      }
    },
    orange: {
      id: 'orange',
      type: 'plant',
      name: '大吉大利橘',
      description: '金黃色的果實，象徵財運滾滾與吉利。',
      color: 'text-orange-500',
      actions: { water: '澆水', leg: '鬆土' },
      get stages() {
        return generateStages(this.id)
      }
    },
    avocado: {
      id: 'avocado',
      type: 'plant',
      name: '森林奶油酪梨',
      description: '營養滿分的超級食物，象徵健康與活力。',
      color: 'text-green-600',
      actions: { water: '澆水', leg: '修剪枝葉' },
      get stages() { return generateStages(this.id, this.type) }
    },
    papaya: {
      id: 'papaya',
      type: 'plant',
      name: '熱帶風情木瓜',
      description: '甜美多汁的熱帶水果，象徵熱情與豐收。',
      color: 'text-orange-400',
      actions: { water: '澆水', leg: '追肥' },
      get stages() { return generateStages(this.id, this.type) }
    },
    banana: {
      id: 'banana',
      type: 'plant',
      name: '快樂香蕉樹',
      description: '彎彎的黃色微笑，象徵滿滿的能量與好心情。',
      color: 'text-yellow-400',
      // 香蕉富含鉀離子預防抽筋，跟抬腿運動很搭！
      actions: { water: '補水', leg: '施肥' },
      get stages() { return generateStages(this.id) }
    },
    grape: {
      id: 'grape',
      type: 'plant',
      name: '紫晶葡萄',
      description: '成串的紫色寶石，象徵多子多孫與豐饒的成果。',
      color: 'text-purple-500', // 新增紫色系
      actions: { water: '澆水', leg: '整理藤蔓' },
      get stages() { return generateStages(this.id) }
    },
    sunflower: {
      id: 'sunflower',
      type: 'plant',
      name: '活力向日葵',
      description: '永遠面向陽光，象徵樂觀與勇敢追求夢想。',
      color: 'text-yellow-400', // 明亮的黃色
      actions: { water: '澆水', leg: '除草' },
      get stages() { return generateStages(this.id) }
    },
    // bamboo: {
    //   id: 'bamboo',
    //   type: 'plant',
    //   name: '步步高昇竹',
    //   description: '一節一節向上生長，象徵事業與健康節節高升。',
    //   color: 'text-emerald-600', // 深綠色
    //   actions: { water: '澆水', leg: '施肥' },
    //   get stages() { return generateStages(this.id) }
    // },
    chicken: {
      id: 'chicken',
      type: 'animal', // 標記為動物
      name: '元氣咕咕雞',
      description: '勤勞早起的小雞，象徵朝氣與希望。',
      color: 'text-yellow-500',
      actions: { water: '呵護', leg: '陪玩' }, 
      get stages() { return generateStages(this.id, this.type) }
    },
    // cow: {
    //   id: 'cow',
    //   type: 'animal',
    //   name: '哞哞乳牛',
    //   description: '提供營養滿滿的牛奶，象徵強壯的骨骼與體魄。',
    //   color: 'text-slate-700', // 黑白色系 (用深灰文字)
    //   // 動作設計：喝水=餵食/補水，抬腿=幫牛刷毛/擠奶(勞動)
    //   actions: { water: '補水', leg: '刷毛' }, 
    //   get stages() { return generateStages(this.id) }
    // },
    // rabbit: {
    //   id: 'rabbit',
    //   type: 'animal',
    //   name: '蹦蹦小白兔',
    //   description: '愛跳愛動的小可愛，象徵靈活的身手與活力。',
    //   color: 'text-pink-400', // 粉色系
    //   // 動作設計：兔子的強項就是後腿，跟使用者的「抬腿」任務完美呼應！
    //   actions: { water: '餵食', leg: '陪跳' }, 
    //   get stages() { return generateStages(this.id) }
    // },
    // sheep: {
    //   id: 'sheep',
    //   type: 'animal',
    //   name: '雲朵綿羊',
    //   description: '軟綿綿的療癒系，象徵優質的睡眠與放鬆。',
    //   color: 'text-blue-300', // 淺藍/白色系
    //   actions: { water: '補水', leg: '剪毛' }, 
    //   get stages() { return generateStages(this.id) }
    // },
  }
  
  // 隨機抽選一顆新樹 (排除目前的樹，避免連續種一樣的)
  export const getRandomItemId = (currentId, unlockedIds = []) => {
    const allKeys = Object.keys(ITEM_DATA)
    
    // 1. 先排除掉「目前正在種」的這一個 (避免剛收成蘋果又種蘋果)
    const availableKeys = allKeys.filter(k => k !== currentId)
    
    // 2. 找出「還沒解鎖」的候選名單
    const newItems = availableKeys.filter(k => !unlockedIds.includes(k))
    
    // 3. 判斷邏輯
    if (newItems.length > 0) {
      // A. 如果還有「新東西」，優先從新東西裡面抽
      console.log('🎉 發現新物種機會！從未解鎖清單中抽選')
      return newItems[Math.floor(Math.random() * newItems.length)]
    } else {
      // B. 如果「全都解鎖了」，就從所有可用的裡面隨機抽 (回味模式)
      console.log('🏆 圖鑑已全滿！隨機重玩模式')
      return availableKeys[Math.floor(Math.random() * availableKeys.length)]
    }
  }