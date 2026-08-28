// ============================================
// 内置常用食物 / 常见菜品预设库（每100g 营养值）
// 数值参照《中国食物成分表》并做实用估算，
// 主要用于免去每次手动填写成本表。
// 用 energy_kj_per100g 自动派生 NRV（国标 8400 kJ/天 基准）
// ============================================

export interface FoodPreset {
  id: string
  /** 食品/菜品名称 */
  name: string
  /** 分类，用于分组展示 */
  category: '主食' | '肉蛋水产' | '蔬菜' | '水果' | '家常菜' | '饮品'
  /** 每100g 能量 kJ */
  energy_kj_per100g: number
  /** 每100g 蛋白质 g */
  protein_g_per100g?: number
  /** 每100g 脂肪 g */
  fat_g_per100g?: number
  /** 每100g 碳水 g */
  carbs_g_per100g?: number
  /** 每100g 钠 mg */
  sodium_mg_per100g?: number
  /** 常见一份参考克数，选填提示用 */
  suggest_grams?: number
}

export const FOOD_PRESETS: FoodPreset[] = [
  // —— 主食 ——
  { id: 'p_rice', name: '熟米饭', category: '主食', energy_kj_per100g: 485, protein_g_per100g: 2.6, fat_g_per100g: 0.3, carbs_g_per100g: 25.9, suggest_grams: 150 },
  { id: 'p_porridge', name: '稀饭/粥', category: '主食', energy_kj_per100g: 190, protein_g_per100g: 1.1, fat_g_per100g: 0.2, carbs_g_per100g: 10 },
  { id: 'p_mantou', name: '馒头', category: '主食', energy_kj_per100g: 925, protein_g_per100g: 7, fat_g_per100g: 1.1, carbs_g_per100g: 47, suggest_grams: 100 },
  { id: 'p_noodle', name: '面条(熟)', category: '主食', energy_kj_per100g: 460, protein_g_per100g: 3.6, fat_g_per100g: 0.4, carbs_g_per100g: 22, suggest_grams: 200 },
  { id: 'p_millet', name: '小米粥', category: '主食', energy_kj_per100g: 200, protein_g_per100g: 1.5, fat_g_per100g: 0.4, carbs_g_per100g: 10 },
  { id: 'p_bread', name: '全麦面包', category: '主食', energy_kj_per100g: 1030, protein_g_per100g: 8.5, fat_g_per100g: 3.4, carbs_g_per100g: 50, suggest_grams: 60 },
  { id: 'p_corn', name: '玉米(煮)', category: '主食', energy_kj_per100g: 460, protein_g_per100g: 4, fat_g_per100g: 1.2, carbs_g_per100g: 22 },
  { id: 'p_sweetpotato', name: '红薯(蒸)', category: '主食', energy_kj_per100g: 414, protein_g_per100g: 1.1, fat_g_per100g: 0.6, carbs_g_per100g: 23 },
  { id: 'p_potato', name: '土豆(蒸/煮)', category: '主食', energy_kj_per100g: 318, protein_g_per100g: 2, fat_g_per100g: 0.1, carbs_g_per100g: 17 },

  // —— 肉蛋水产 ——
  { id: 'p_egg', name: '鸡蛋', category: '肉蛋水产', energy_kj_per100g: 602, protein_g_per100g: 13.1, fat_g_per100g: 9.5, carbs_g_per100g: 2.8, suggest_grams: 55 },
  { id: 'p_pork', name: '猪肉(瘦)', category: '肉蛋水产', energy_kj_per100g: 611, protein_g_per100g: 20.3, fat_g_per100g: 6.2, carbs_g_per100g: 1.5 },
  { id: 'p_beef', name: '牛肉(瘦)', category: '肉蛋水产', energy_kj_per100g: 500, protein_g_per100g: 20, fat_g_per100g: 4, carbs_g_per100g: 0 },
  { id: 'p_chicken_breast', name: '鸡胸肉', category: '肉蛋水产', energy_kj_per100g: 560, protein_g_per100g: 19.4, fat_g_per100g: 5, carbs_g_per100g: 0 },
  { id: 'p_chicken_leg', name: '鸡腿肉', category: '肉蛋水产', energy_kj_per100g: 770, protein_g_per100g: 16, fat_g_per100g: 13, carbs_g_per100g: 0 },
  { id: 'p_fish', name: '鱼肉(草鱼/清蒸)', category: '肉蛋水产', energy_kj_per100g: 460, protein_g_per100g: 17, fat_g_per100g: 4, carbs_g_per100g: 0 },
  { id: 'p_shrimp', name: '虾', category: '肉蛋水产', energy_kj_per100g: 400, protein_g_per100g: 18, fat_g_per100g: 1.5, carbs_g_per100g: 2 },
  { id: 'p_tofu', name: '北豆腐', category: '肉蛋水产', energy_kj_per100g: 400, protein_g_per100g: 9.6, fat_g_per100g: 5.4, carbs_g_per100g: 2 },
  { id: 'p_soymilk', name: '豆浆', category: '饮品', energy_kj_per100g: 140, protein_g_per100g: 1.8, fat_g_per100g: 0.7, carbs_g_per100g: 4.5, suggest_grams: 300 },
  { id: 'p_yogurt_ambrosial', name: '安慕希酸奶', category: '饮品', energy_kj_per100g: 383, protein_g_per100g: 3.1, fat_g_per100g: 3.4, carbs_g_per100g: 12, suggest_grams: 205 },

  // —— 蔬菜 ——
  { id: 'p_tomato', name: '番茄/西红柿', category: '蔬菜', energy_kj_per100g: 80, protein_g_per100g: 0.9, fat_g_per100g: 0.2, carbs_g_per100g: 4 },
  { id: 'p_cucumber', name: '黄瓜', category: '蔬菜', energy_kj_per100g: 65, protein_g_per100g: 0.8, fat_g_per100g: 0.2, carbs_g_per100g: 2.9 },
  { id: 'p_spinach', name: '菠菜(熟)', category: '蔬菜', energy_kj_per100g: 100, protein_g_per100g: 2.6, fat_g_per100g: 0.3, carbs_g_per100g: 4.5 },
  { id: 'p_broccoli', name: '西兰花', category: '蔬菜', energy_kj_per100g: 140, protein_g_per100g: 2.8, fat_g_per100g: 0.4, carbs_g_per100g: 6.6 },
  { id: 'p_lettuce', name: '生菜', category: '蔬菜', energy_kj_per100g: 60, protein_g_per100g: 1.3, fat_g_per100g: 0.3, carbs_g_per100g: 2 },
  { id: 'p_cabbage', name: '大白菜', category: '蔬菜', energy_kj_per100g: 75, protein_g_per100g: 1.5, fat_g_per100g: 0.2, carbs_g_per100g: 3.2 },
  { id: 'p_wintermelon', name: '冬瓜', category: '蔬菜', energy_kj_per100g: 46, protein_g_per100g: 0.4, fat_g_per100g: 0.2, carbs_g_per100g: 2.6 },
  { id: 'p_mushroom', name: '香菇(鲜)', category: '蔬菜', energy_kj_per100g: 80, protein_g_per100g: 2.2, fat_g_per100g: 0.3, carbs_g_per100g: 5.2 },
  { id: 'p_carrot', name: '胡萝卜', category: '蔬菜', energy_kj_per100g: 160, protein_g_per100g: 1, fat_g_per100g: 0.2, carbs_g_per100g: 8.8 },

  // —— 水果 ——
  { id: 'p_orange', name: '橘子', category: '水果', energy_kj_per100g: 184, protein_g_per100g: 0.7, fat_g_per100g: 0.2, carbs_g_per100g: 10.5, suggest_grams: 150 },

  // —— 常见家常菜（含油估算） ——
  { id: 'd_tomato_egg_rice', name: '番茄鸡蛋饭', category: '家常菜', energy_kj_per100g: 490, protein_g_per100g: 3, fat_g_per100g: 4, carbs_g_per100g: 17, suggest_grams: 400 },
  { id: 'd_tomato_egg', name: '番茄炒蛋', category: '家常菜', energy_kj_per100g: 420, protein_g_per100g: 7, fat_g_per100g: 8, carbs_g_per100g: 5 },
  { id: 'd_redbraised_pork', name: '红烧肉', category: '家常菜', energy_kj_per100g: 1500, protein_g_per100g: 10, fat_g_per100g: 32, carbs_g_per100g: 8 },
  { id: 'd_kungpao_chicken', name: '宫保鸡丁', category: '家常菜', energy_kj_per100g: 800, protein_g_per100g: 12, fat_g_per100g: 9, carbs_g_per100g: 15 },
  { id: 'd_yuxiang_pork', name: '鱼香肉丝', category: '家常菜', energy_kj_per100g: 750, protein_g_per100g: 9, fat_g_per100g: 8, carbs_g_per100g: 16 },
  { id: 'd_greenpepper_pork', name: '青椒炒肉', category: '家常菜', energy_kj_per100g: 750, protein_g_per100g: 10, fat_g_per100g: 8, carbs_g_per100g: 8 },
  { id: 'd_stirveg', name: '清炒青菜', category: '家常菜', energy_kj_per100g: 300, protein_g_per100g: 2, fat_g_per100g: 6, carbs_g_per100g: 5 },
  { id: 'd_sourpotato', name: '酸辣土豆丝', category: '家常菜', energy_kj_per100g: 420, protein_g_per100g: 2, fat_g_per100g: 5, carbs_g_per100g: 15 },
  { id: 'd_boiledshrimp', name: '白灼虾', category: '家常菜', energy_kj_per100g: 420, protein_g_per100g: 17, fat_g_per100g: 2, carbs_g_per100g: 2 },
  { id: 'd_steamedfish', name: '清蒸鱼', category: '家常菜', energy_kj_per100g: 500, protein_g_per100g: 16, fat_g_per100g: 5, carbs_g_per100g: 1 },
  { id: 'd_egg_rice', name: '蛋炒饭', category: '家常菜', energy_kj_per100g: 700, protein_g_per100g: 5, fat_g_per100g: 6, carbs_g_per100g: 24, suggest_grams: 300 },
]