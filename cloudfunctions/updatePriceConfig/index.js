// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取用户OpenID
    const { OPENID } = cloud.getWXContext()
    const { priceConfig } = event
    
    // 验证价格配置数据
    if (!priceConfig) {
      return {
        success: false,
        message: '价格配置数据不能为空'
      }
    }
    
    // 检查所有价格参数是否为正数
    const priceFields = [
      'basePrice', 'hourlyPrice', 'twoHoursPrice', 
      'workdayDiscount', 'workdayMaxPrice', 'workdayMaxHours',
      'weekendMaxPrice', 'weekendMaxHours',
      'fourHoursDiscount', 'sixHoursDiscount', 'sevenHoursDiscount'
    ]
    
    for (const field of priceFields) {
      if (priceConfig[field] === undefined || priceConfig[field] === null) {
        return {
          success: false,
          message: `价格参数 ${field} 不能为空`
        }
      }
      
      if (typeof priceConfig[field] !== 'number' || priceConfig[field] < 0) {
        return {
          success: false,
          message: `价格参数 ${field} 必须是非负数`
        }
      }
    }
    
    // 尝试创建admin集合（如果不存在）
    try {
      await db.createCollection('admin')
      console.log('创建admin集合成功')
    } catch (err) {
      // 集合可能已存在，忽略错误
      console.log('admin集合可能已存在', err)
    }
    
    let isAdmin = false
    
    // 尝试验证管理员权限
    try {
      // 验证管理员权限（检查用户是否在管理员列表中）
      const adminResult = await db.collection('admin').where({
        type: 'admins',
        openids: OPENID
      }).get()
      
      if (adminResult.data.length > 0) {
        isAdmin = true
      } else {
        // 检查是否有管理员密码记录
        const passwordResult = await db.collection('admin').where({
          type: 'password'
        }).get()
        
        // 如果没有任何管理员记录，则认为是首次设置，允许操作
        if (passwordResult.data.length === 0) {
          console.log('首次设置，允许操作')
          isAdmin = true
          
          // 创建默认管理员记录
          await db.collection('admin').add({
            data: {
              type: 'admins',
              openids: [OPENID],
              createTime: db.serverDate()
            }
          })
        }
      }
    } catch (err) {
      console.log('验证管理员权限失败，假设是首次设置', err)
      isAdmin = true // 假设是首次设置，允许操作
      
      // 创建默认管理员记录
      try {
        await db.collection('admin').add({
          data: {
            type: 'admins',
            openids: [OPENID],
            createTime: db.serverDate()
          }
        })
      } catch (addErr) {
        console.log('创建管理员记录失败', addErr)
      }
    }
    
    if (!isAdmin) {
      return {
        success: false,
        message: '没有管理员权限'
      }
    }
    
    // 尝试创建priceConfig集合（如果不存在）
    try {
      await db.createCollection('priceConfig')
      console.log('创建priceConfig集合成功')
    } catch (err) {
      // 集合可能已存在，忽略错误
      console.log('priceConfig集合可能已存在', err)
    }
    
    // 创建新的价格配置数据（不包含_id字段）
    const newConfigData = {
      basePrice: priceConfig.basePrice,
      hourlyPrice: priceConfig.hourlyPrice,
      twoHoursPrice: priceConfig.twoHoursPrice,
      workdayDiscount: priceConfig.workdayDiscount,
      workdayMaxPrice: priceConfig.workdayMaxPrice,
      workdayMaxHours: priceConfig.workdayMaxHours,
      weekendMaxPrice: priceConfig.weekendMaxPrice,
      weekendMaxHours: priceConfig.weekendMaxHours,
      fourHoursDiscount: priceConfig.fourHoursDiscount,
      sixHoursDiscount: priceConfig.sixHoursDiscount,
      sevenHoursDiscount: priceConfig.sevenHoursDiscount,
      updateTime: db.serverDate()
    }
    
    // 检查是否已存在价格配置
    const existingConfigs = await db.collection('priceConfig').get()
    
    if (existingConfigs.data && existingConfigs.data.length > 0) {
      // 如果存在配置，更新最新的一条
      const latestConfig = existingConfigs.data[0]
      
      console.log('更新现有配置，ID:', latestConfig._id)
      
      // 使用更新操作而不是添加，确保不包含_id字段
      await db.collection('priceConfig').doc(latestConfig._id).update({
        data: newConfigData
      })
      
      return {
        success: true,
        message: '价格配置更新成功',
        data: { ...newConfigData, _id: latestConfig._id }
      }
    } else {
      // 如果不存在配置，添加新配置
      const addResult = await db.collection('priceConfig').add({
        data: newConfigData
      })
      
      return {
        success: true,
        message: '价格配置创建成功',
        data: { ...newConfigData, _id: addResult._id }
      }
    }
  } catch (err) {
    console.error('更新价格配置失败', err)
    return {
      success: false,
      message: '更新价格配置失败: ' + err.message,
      error: err
    }
  }
} 