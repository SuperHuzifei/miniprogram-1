// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { id } = event
  
  try {
    // 查找预约记录
    const appointment = await db.collection('appointments').doc(id).get()
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
        message: '无权取消此预约'
      }
    }
    
    // 检查预约是否已取消
    if (appointment.data.isCanceled) {
      return {
        success: false,
        message: '该预约已取消'
      }
    }
    
    // 更新预约记录
    const updateData = {
      isCanceled: true,
      cancelTime: db.serverDate()
    }
    
    // 如果已支付，则标记为退款中
    if (appointment.data.isPaid) {
      updateData.isRefunded = false
      updateData.status = '退款中'
      
      // 保留预约记录，只更新状态
      await db.collection('appointments').doc(id).update({
        data: updateData
      })
      
      return {
        success: true,
        message: '预约已取消，退款将在1个工作日内处理'
      }
    } else {
      // 未支付，直接取消 - 保留记录，不标记为删除
      updateData.status = '已取消'
      
      await db.collection('appointments').doc(id).update({
        data: updateData
      })
      
      return {
        success: true,
        message: '预约已取消'
      }
    }
  } catch (err) {
    console.error('取消预约失败', err)
    return {
      success: false,
      message: '取消预约失败',
      error: err
    }
  }
} 