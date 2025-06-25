// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userInfo } = event
  
  try {
    console.log('开始处理用户登录请求', { openid: wxContext.OPENID, userInfo })
    
    // 验证用户信息
    if (!userInfo) {
      console.error('用户信息不能为空')
      return {
        success: false,
        message: '用户信息不能为空'
      }
    }
    
    // 验证 openid
    if (!wxContext.OPENID) {
      console.error('无法获取用户 openid')
      return {
        success: false,
        message: '用户未登录'
      }
    }
  
    // 确保统一使用 nickname 作为字段名
    const nickname = userInfo.nickname || userInfo.nickName || '用户'
    const avatarUrl = userInfo.avatarUrl || ''
    const gender = userInfo.gender || 0
    
    console.log('处理用户数据', { nickname, avatarUrl, gender })
    
    // 查询用户是否已存在
    const userRecord = await db.collection('users').where({
      openid: wxContext.OPENID
    }).get()
    
    console.log('查询用户记录结果', { count: userRecord.data.length })
    
    if (userRecord.data.length > 0) {
      // 用户已存在，更新用户信息
      console.log('更新已存在用户信息')
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
      console.log('创建新用户')
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
    
    console.log('用户登录成功')
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
      message: '用户登录失败，请稍后再试',
      error: err.message
    }
  }
} 