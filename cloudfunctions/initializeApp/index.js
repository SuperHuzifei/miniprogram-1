// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 需要创建的集合列表
const COLLECTIONS = [
  'admin',
  'priceConfig',
  'appointments',
  'users',
  'siteConfig'
]

// 需要创建的索引列表
const INDEXES = [
  {
    collection: 'admin',
    indexes: [
      {
        name: 'type_index',
        field: { type: 1 }
      }
    ]
  },
  {
    collection: 'appointments',
    indexes: [
      {
        name: 'date_index',
        field: { date: 1 }
      },
      {
        name: 'status_index',
        field: { status: 1 }
      },
      {
        name: 'openid_index',
        field: { _openid: 1 }
      }
    ]
  }
]

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const results = {
      collections: {},
      indexes: {}
    }

    // 创建集合
    for (const collection of COLLECTIONS) {
      try {
        await db.createCollection(collection)
        results.collections[collection] = 'created'
      } catch (err) {
        // 集合可能已存在
        results.collections[collection] = 'exists'
      }
    }

    // 创建索引
    for (const indexConfig of INDEXES) {
      const collection = indexConfig.collection
      results.indexes[collection] = {}
      
      for (const index of indexConfig.indexes) {
        try {
          await db.collection(collection).createIndex(index)
          results.indexes[collection][index.name] = 'created'
        } catch (err) {
          // 索引可能已存在
          results.indexes[collection][index.name] = 'error: ' + err.message
        }
      }
    }

    // 检查是否需要创建默认价格配置
    const priceConfigResult = await db.collection('priceConfig').get()
    if (!priceConfigResult.data || priceConfigResult.data.length === 0) {
      // 创建默认价格配置
      const defaultConfig = {
        basePrice: 45, // 第一小时价格
        hourlyPrice: 35, // 后续每小时价格
        twoHoursPrice: 70, // 2小时特价
        workdayDiscount: 5, // 工作日每小时优惠金额
        workdayMaxPrice: 185, // 工作日封顶价格
        workdayMaxHours: 6, // 工作日封顶小时数
        weekendMaxPrice: 220, // 周末封顶价格
        weekendMaxHours: 8, // 周末封顶小时数
        fourHoursDiscount: 5, // 4小时优惠
        sixHoursDiscount: 10, // 6小时优惠
        sevenHoursDiscount: 10, // 7小时优惠
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
      
      await db.collection('priceConfig').add({
        data: defaultConfig
      })
      
      results.defaultConfig = 'created'
    } else {
      results.defaultConfig = 'exists'
    }

    return {
      success: true,
      message: '应用初始化成功',
      results
    }
  } catch (err) {
    console.error('应用初始化失败', err)
    return {
      success: false,
      message: '应用初始化失败: ' + err.message,
      error: err
    }
  }
} 