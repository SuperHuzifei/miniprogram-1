// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id } = event
  
  if (!id) {
    return {
      success: false,
      message: '预约ID不能为空'
    }
  }
  
  try {
    // 查询预约信息
    const appointmentResult = await db.collection('appointments').doc(id).get()
    
    if (!appointmentResult.data) {
      return {
        success: false,
        message: '预约不存在'
      }
    }
    
    const appointment = appointmentResult.data
    
    // 检查预约状态
    if (appointment.status === '已取消') {
      return {
        success: false,
        message: '该预约已经被取消'
      }
    }
    
    if (appointment.status === '已完成') {
      return {
        success: false,
        message: '该预约已经完成，无法取消'
      }
    }
    
    // 更新预约状态为"已取消"
    await db.collection('appointments').doc(id).update({
      data: {
        status: '已取消',
        updateTime: db.serverDate(),
        canceledTime: db.serverDate(), // 记录取消时间
        cancelReason: '管理员取消' // 取消原因
      }
    })
    
    // 可以在这里添加发送模板消息通知用户的代码
    
    return {
      success: true,
      message: '取消预约成功'
    }
  } catch (error) {
    console.error('取消预约失败', error)
    return {
      success: false,
      message: '取消预约失败',
      error
    }
  }
} 