// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  // 确保统一使用 nickname 作为字段名
  const nickname = userInfo.nickname || userInfo.nickName
  const avatarUrl = userInfo.avatarUrl
  const gender = userInfo.gender
  
  try {
    // 查询用户是否已存在
    const userRecord = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    
    if (userRecord.data.length > 0) {
      // 用户已存在，更新用户信息
      await db.collection('users').where({
        openid: wxContext.OPENID
      }).update({
        data: {
          nickname,
          avatarUrl,
          gender,
          updateTime: db.serverDate()
        }
      })
    } else {
      // 用户不存在，创建新用户
      await db.collection('users').add({
        data: {
          openid: wxContext.OPENID,
          nickname,
          avatarUrl,
          gender,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
    
    return {
      success: true,
      openid: wxContext.OPENID,
      userInfo: {
        nickname,
        avatarUrl,
        gender
      }
    }
  } catch (err) {
    console.error('用户登录失败', err)
    return {
      success: false,
      message: '用户登录失败',
      error: err
    }
  }
} 