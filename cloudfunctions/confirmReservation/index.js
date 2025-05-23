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
    if (appointment.data.isCanceled) {
      return {
        success: false,
        message: '该预约已取消'
      }
    }
    
    if (appointment.data.status === '待审核' || appointment.data.status === '已确认') {
      return {
        success: false,
        message: '该预约已提交确认'
      }
    }
    
    // 更新预约状态为待审核
    await db.collection('appointments').doc(appointmentId).update({
      data: {
        status: '待审核'
      }
    })
    
    return {
      success: true,
      message: '预约已提交，等待客服确认'
    }
  } catch (err) {
    console.error('确认预约失败', err)
    return {
      success: false,
      message: '确认预约失败',
      error: err
    }
  }
} 