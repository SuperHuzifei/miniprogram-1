// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { id, doorPassword } = event
  
  if (!id) {
    return {
      success: false,
      message: '预约ID不能为空'
    }
  }
  
  if (!doorPassword) {
    return {
      success: false,
      message: '开门密码不能为空'
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
    
    // 检查预约状态，只有已确认的预约才能修改密码
    if (appointment.status !== '已确认') {
      return {
        success: false,
        message: `当前预约状态为"${appointment.status}"，不能修改开门密码`
      }
    }
    
    // 更新开门密码
    await db.collection('appointments').doc(id).update({
      data: {
        doorPassword: doorPassword,
        updateTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '开门密码更新成功',
      doorPassword: doorPassword
    }
  } catch (error) {
    console.error('更新开门密码失败', error)
    return {
      success: false,
      message: '更新开门密码失败',
      error
    }
  }
} 