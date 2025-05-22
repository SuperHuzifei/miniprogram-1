// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
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
    
    // 检查预约状态
    if (!appointment.data.isPaid || !appointment.data.isCanceled) {
      return {
        success: false,
        message: '该预约不符合退款条件'
      }
    }
    
    if (appointment.data.isRefunded) {
      return {
        success: false,
        message: '该预约已退款'
      }
    }
    
    // 更新预约记录
    await db.collection('appointments').doc(id).update({
      data: {
        isRefunded: true,
        status: '已退款',
        refundTime: db.serverDate()
      }
    })
    
    return {
      success: true,
      message: '退款处理成功'
    }
  } catch (err) {
    console.error('退款处理失败', err)
    return {
      success: false,
      message: '退款处理失败',
      error: err
    }
  }
} 