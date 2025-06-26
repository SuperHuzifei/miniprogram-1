// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { images } = event
  
  try {
    // 检查是否存在siteConfig集合
    try {
      await db.createCollection('siteConfig')
    } catch (error) {
      // 集合可能已存在，忽略错误
    }
    
    // 更新或创建轮播图配置
    try {
      // 尝试更新已有记录
      await db.collection('siteConfig').doc('bannerImages').update({
        data: {
          images,
          updateTime: db.serverDate()
        }
      })
      
      return {
        success: true,
        message: '轮播图设置已更新'
      }
    } catch (updateError) {
      // 如果更新失败，尝试创建新记录
      try {
        await db.collection('siteConfig').add({
          data: {
            _id: 'bannerImages',
            images,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
        
        return {
          success: true,
          message: '轮播图设置已创建'
        }
      } catch (addError) {
        console.error('创建轮播图设置失败', addError)
        return {
          success: false,
          message: '创建轮播图设置失败',
          error: addError
        }
      }
    }
  } catch (error) {
    console.error('更新轮播图设置失败', error)
    return {
      success: false,
      message: '更新轮播图设置失败',
      error
    }
  }
} 