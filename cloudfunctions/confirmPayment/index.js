// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { appointmentId } = event
  
  try {
    // 查找预约记录
    const appointment = await db.collection('appointments').doc(appointmentId).get()
    if (!appointment.data) {
      return {
        success: false,
        message: '未找到预约记录'
      }
    }
    
    // 检查是否是本人的预约
    if (appointment.data.openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '无权操作此预约'
      }
    }
    
    // 检查预约状态
    if (appointment.data.isPaid) {
      return {
        success: false,
        message: '该预约已支付'
      }
    }
    
    if (appointment.data.isDeleted || appointment.data.isCanceled) {
      return {
        success: false,
        message: '该预约已取消'
      }
    }
    
    // 更新预约状态为待审核
    await db.collection('appointments').doc(appointmentId).update({
      data: {
        status: '待审核支付',
        updateTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '支付确认已提交，等待管理员审核'
    }
  } catch (err) {
    console.error('确认支付失败', err)
    return {
      success: false,
      message: '操作失败，请重试',
      error: err
    }
  }
} 