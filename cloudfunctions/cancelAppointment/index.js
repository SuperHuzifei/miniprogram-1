// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { id } = event
  
  try {
    // 先检查预约是否存在且属于当前用户
    const appointment = await db.collection('appointments').doc(id).get()
    
    if (!appointment.data) {
      return {
        success: false,
        message: '预约不存在或已被取消'
      }
    }
    
    // 检查预约是否属于当前用户
    if (appointment.data.openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '无权操作此预约'
      }
    }
    
    // 执行软删除（标记为已删除而不是真正删除）
    await db.collection('appointments').doc(id).update({
      data: {
        isDeleted: true,
        updateTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '取消预约成功'
    }
  } catch (err) {
    console.error('取消预约失败', err)
    return {
      success: false,
      message: '取消预约失败，请重试',
      error: err
    }
  }
} 