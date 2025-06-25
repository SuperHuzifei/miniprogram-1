// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { date, times, phone } = event
  
  try {
    // 检查时间段是否连续
    if (!areTimeSlotsContiguous(times)) {
      return {
        success: false,
        message: '请选择连续的时间段进行预约'
      }
    }
    
    // 检查所有时间段是否已被预约
    const existingAppointments = await db.collection('appointments').where({
      date,
      status: { $ne: '已取消' } // 只考虑未取消的预约
    }).get()
    
    const bookedTimes = new Set()
    existingAppointments.data.forEach(appointment => {
      // 处理时间段
      if (Array.isArray(appointment.times)) {
        appointment.times.forEach(time => bookedTimes.add(time))
      }
    })
    
    // 检查是否有时间冲突
    const hasConflict = times.some(time => bookedTimes.has(time))
    if (hasConflict) {
      return {
        success: false,
        message: '所选时间段已被预约，请重新选择'
      }
    }
    
    // 获取用户信息
    let userName = '未知用户'
    try {
      const userInfo = await db.collection('users').where({
        openid: wxContext.OPENID
      }).get()
      
      if (userInfo.data.length > 0) {
        userName = userInfo.data[0].nickname || '未知用户'
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
    
    // 计算预约时长（小时数）
    const hours = times.length
    
    // 计算价格：1小时45元，大于1小时时每小时35元
    let amount = 0
    if (hours === 1) {
      amount = 45 // 1小时45元
    } else if (hours > 1) {
      amount = hours * 35 // 多于1小时，每小时35元
    }
    
    // 创建预约记录 - 直接设置状态为待审核
    const result = await db.collection('appointments').add({
      data: {
        openid: wxContext.OPENID,
        userName, // 添加用户名称
        date,
        times,
        phone,
        createTime: db.serverDate(),
        hours,
        status: '待审核'
      }
    })
    
    return {
      success: true,
      message: '预约创建成功，请联系客服确认',
      data: {
        appointmentId: result._id,
        hours,
        amount: amount // 使用新的价格计算逻辑
      }
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

// 检查时间段是否连续
function areTimeSlotsContiguous(times) {
  if (!times || times.length === 0) return false
  if (times.length === 1) return true
  
  // 解析时间段
  const timeRanges = times.map(time => {
    const [start, end] = time.split('-')
    return { start, end }
  })
  
  // 按开始时间排序
  timeRanges.sort((a, b) => {
    if (a.start < b.start) return -1
    if (a.start > b.start) return 1
    return 0
  })
  
  // 检查每个相邻时间段是否连续
  for (let i = 0; i < timeRanges.length - 1; i++) {
    if (timeRanges[i].end !== timeRanges[i + 1].start) {
      return false
    }
  }
  
  return true
} 