// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { nickname } = event
  
  try {
    // 验证昵称
    if (!nickname || nickname.trim() === '') {
      return {
        success: false,
        message: '用户名不能为空'
      }
    }
    
    // 验证 openid
    if (!wxContext.OPENID) {
      return {
        success: false,
        message: '用户未登录'
      }
    }
    
    // 更新用户信息并获取更新后的文档
    const trimmedNickname = nickname.trim()
    const updateResult = await db.collection('users').doc(
      db.collection('users').where({
        openid: wxContext.OPENID
      }).get().then(res => {
        if (res.data.length === 0) {
          throw new Error('未找到用户信息')
        }
        return res.data[0]._id
      })
    ).update({
      data: {
        nickname: trimmedNickname,
        updateTime: db.serverDate()
      }
    })
    
    if (updateResult.stats.updated === 0) {
      return {
        success: false,
        message: '更新失败，用户可能不存在'
      }
    }
    
    // 获取用户信息
    const userRecord = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    
    if (userRecord.data.length > 0) {
      const userData = userRecord.data[0]
      
      return {
        success: true,
        message: '用户名更新成功',
        userInfo: {
          nickname: userData.nickname,
          avatarUrl: userData.avatarUrl,
          gender: userData.gender
        }
      }
    } else {
      return {
        success: false,
        message: '未找到用户信息'
      }
    }
  } catch (err) {
    console.error('更新用户名失败', err)
    return {
      success: false,
      message: '更新用户名失败，请稍后再试',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    }
  }
} 