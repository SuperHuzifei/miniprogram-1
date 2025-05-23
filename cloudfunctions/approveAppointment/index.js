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
    if (appointment.status !== '待审核') {
      return {
        success: false,
        message: `当前预约状态为"${appointment.status}"，不能审核通过`
      }
    }
    
    // 使用提供的密码或生成随机密码
    const password = doorPassword || generateRandomPassword();
    
    // 更新预约状态为"已确认"
    await db.collection('appointments').doc(id).update({
      data: {
        status: '已确认',
        updateTime: db.serverDate(),
        approvedTime: db.serverDate(), // 记录审核时间
        doorPassword: password // 添加开门密码
      }
    })
    
    // 可以在这里添加发送模板消息通知用户的代码
    
    return {
      success: true,
      message: '审核通过成功',
      doorPassword: password
    }
  } catch (error) {
    console.error('审核预约失败', error)
    return {
      success: false,
      message: '审核预约失败',
      error
    }
  }
}

// 生成6位数字随机密码
function generateRandomPassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
} 