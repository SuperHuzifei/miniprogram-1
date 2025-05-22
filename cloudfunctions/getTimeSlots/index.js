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
    ]
    
    // 查询指定日期已有的预约
    const bookedAppointments = await db.collection('appointments').where({
      date: date,
      isDeleted: false // 只考虑未取消的预约
    }).get()
    
    // 标记已预约的时间段为不可用
    const bookedTimes = []
    bookedAppointments.data.forEach(appointment => {
      // 如果是数组，处理多个时间段
      if (Array.isArray(appointment.times)) {
        bookedTimes.push(...appointment.times)
      } 
      // 兼容旧数据，如果是单个时间字段
      else if (appointment.time) {
        bookedTimes.push(appointment.time)
      }
    })
    
    const timeSlots = allTimeSlots.map(slot => {
      return {
        ...slot,
        isAvailable: !bookedTimes.includes(slot.time)
      }
    })
    
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