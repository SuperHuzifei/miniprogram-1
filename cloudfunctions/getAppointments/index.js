// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取用户的预约记录，按创建时间倒序排列
    const appointments = await db.collection('appointments')
      .where({
        openid: wxContext.OPENID,
        isDeleted: false
      })
      .orderBy('createTime', 'desc')
      .get()
    
    return {
      success: true,
      data: appointments.data
    }
  } catch (err) {
    console.error('获取预约记录失败', err)
    return {
      success: false,
      message: '获取预约记录失败',
      error: err
    }
  }
} 