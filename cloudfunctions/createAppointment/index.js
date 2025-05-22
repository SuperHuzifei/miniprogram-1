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
      isDeleted: false
    }).get()
    
    const bookedTimes = []
    existingAppointments.data.forEach(appointment => {
      // 如果是数组，处理多个时间段
      if (Array.isArray(appointment.times)) {
        bookedTimes.push(...appointment.times)
      } 
      // 兼容旧数据，如果是单个时间字段
      else if (appointment.time) {
        bookedTimes.push(appointment.time)
      }
    })
    
    // 检查是否有时间冲突
    const hasConflict = times.some(time => bookedTimes.includes(time))
    if (hasConflict) {
      return {
        success: false,
        message: '所选时间段已被预约，请重新选择'
      }
    }
    
    // 计算预约时长（小时数）
    const hours = times.length
    
    // 创建预约记录
    const result = await db.collection('appointments').add({
      data: {
        openid: wxContext.OPENID,
        date,
        times,
        phone,
        createTime: db.serverDate(),
        isDeleted: false,
        // 支付相关字段
        isPaid: false,
        isCanceled: false,
        isRefunded: false,
        hours,
        amount: hours * 20, // 每小时20元，可以在管理后台调整单价
        status: '待支付'
      }
    })
    
    return {
      success: true,
      message: '预约成功，请完成支付',
      data: {
        appointmentId: result._id,
        amount: hours * 20,
        hours
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