// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 查询用户是否已存在
    const userRecord = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    
    if (userRecord.data.length > 0) {
      // 用户已登录，返回用户信息
      const userData = userRecord.data[0]
      return {
        success: true,
        isLogin: true,
        userInfo: {
          nickname: userData.nickname,
          avatarUrl: userData.avatarUrl,
          gender: userData.gender
        }
      }
    } else {
      // 用户未登录
      return {
        success: true,
        isLogin: false
      }
    }
  } catch (err) {
    console.error('检查用户登录状态失败', err)
    return {
      success: false,
      message: '检查用户登录状态失败',
      error: err
    }
  }
} 