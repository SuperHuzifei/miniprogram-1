// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { date } = event
  
  try {
    // 定义所有时间段 - 1小时一个时间段
    const allTimeSlots = [
      { time: '10:00-11:00', isAvailable: true },
      { time: '11:00-12:00', isAvailable: true },
      { time: '12:00-13:00', isAvailable: true },
      { time: '13:00-14:00', isAvailable: true },
      { time: '14:00-15:00', isAvailable: true },
      { time: '15:00-16:00', isAvailable: true },
      { time: '16:00-17:00', isAvailable: true },
      { time: '17:00-18:00', isAvailable: true },
      { time: '18:00-19:00', isAvailable: true },
      { time: '19:00-20:00', isAvailable: true },
      { time: '20:00-21:00', isAvailable: true },
      { time: '21:00-22:00', isAvailable: true },
      { time: '22:00-23:00', isAvailable: true },
      { time: '23:00-23:59', isAvailable: true },
    ]
    
    // 查询指定日期已有的预约
    const bookedAppointments = await db.collection('appointments').where({
      date: date,
      status: { $ne: '已取消' } // 只考虑未取消的预约
    }).get()
    
    // 收集所有已预约的时间段
    const bookedTimes = new Set()
    bookedAppointments.data.forEach(appointment => {
      // 处理时间段
      if (Array.isArray(appointment.times)) {
        appointment.times.forEach(time => bookedTimes.add(time))
      }
    })
    
    // 标记已预约的时间段为不可用
    const timeSlots = allTimeSlots.map(slot => ({
      ...slot,
      isAvailable: !bookedTimes.has(slot.time)
    }))
    
    return {
      success: true,
      data: timeSlots
    }
  } catch (err) {
    console.error('获取时间段失败', err)
    return {
      success: false,
      message: '获取时间段失败',
      error: err
    }
  }
} 