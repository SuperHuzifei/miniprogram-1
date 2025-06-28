// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 默认价格配置
const getDefaultConfig = () => {
  return {
    // 基本价格
    basePrice: 45, // 第一小时价格
    hourlyPrice: 35, // 后续每小时价格
    
    // 特殊时段价格
    twoHoursPrice: 70, // 2小时特价
    
    // 工作日优惠
    workdayDiscount: 5, // 工作日每小时优惠金额
    workdayMaxPrice: 185, // 工作日封顶价格
    workdayMaxHours: 6, // 工作日封顶小时数
    
    // 周末价格
    weekendMaxPrice: 220, // 周末封顶价格
    weekendMaxHours: 8, // 周末封顶小时数
    
    // 其他优惠
    fourHoursDiscount: 5, // 4小时优惠
    sixHoursDiscount: 10, // 6小时优惠
    sevenHoursDiscount: 10, // 7小时优惠
    
    // 创建时间
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 尝试创建priceConfig集合（如果不存在）
    try {
      await db.createCollection('priceConfig')
      console.log('创建priceConfig集合成功')
    } catch (err) {
      // 集合可能已存在，忽略错误
      console.log('priceConfig集合可能已存在', err)
    }
    
    // 从数据库获取价格配置
    const configCollection = db.collection('priceConfig')
    
    // 直接尝试获取所有价格配置
    try {
      const result = await configCollection.get()
      
      // 如果有配置数据，返回第一条（最新的）
      if (result.data && result.data.length > 0) {
        return {
          success: true,
          data: result.data[0]
        }
      }
      
      // 如果没有配置，创建默认配置
      const defaultConfig = getDefaultConfig()
      
      try {
        // 添加默认配置到数据库
        const addResult = await configCollection.add({
          data: defaultConfig
        })
        
        // 添加成功，返回默认配置（包含ID）
        if (addResult._id) {
          return {
            success: true,
            data: { ...defaultConfig, _id: addResult._id }
          }
        }
        
        return {
          success: true,
          data: defaultConfig
        }
      } catch (addErr) {
        console.error('添加默认配置失败', addErr)
        // 即使添加失败，也返回默认配置
        return {
          success: true,
          data: defaultConfig
        }
      }
    } catch (err) {
      console.error('获取价格配置失败', err)
      // 返回默认配置
      return {
        success: true,
        data: getDefaultConfig()
      }
    }
  } catch (err) {
    console.error('获取价格配置失败', err)
    // 返回默认配置
    return {
      success: true,
      data: getDefaultConfig(),
      message: '获取价格配置失败，使用默认配置'
    }
  }
} 