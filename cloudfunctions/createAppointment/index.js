// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, time, phone } = event
  
  try {
    // 检查时间段是否已被预约
    const existingAppointment = await db.collection('appointments').where({
      date,
      time,
      // 只检查有效预约（未被取消的）
      isDeleted: false
    }).get()
    
    if (existingAppointment.data.length > 0) {
      return {
        success: false,
        message: '该时间段已被预约，请选择其他时间段'
      }
    }
    
    // 创建预约记录
    const result = await db.collection('appointments').add({
      data: {
        openid: wxContext.OPENID,
        date,
        time,
        phone,
        createTime: db.serverDate(),
        isDeleted: false
      }
    })
    
    return {
      success: true,
      message: '预约成功',
      data: result
    }
  } catch (err) {
    console.error('创建预约失败', err)
    return {
      success: false,
      message: '预约失败，请重试',
      error: err
    }
  }
} 