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
    
    // 验证是否是该用户的预约
    if (appointment.data.openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '无权操作此预约'
      }
    }
    
    // 如果已经取消，返回错误
    if (appointment.data.status === '已取消') {
      return {
        success: false,
        message: '该预约已经取消'
      }
    }
    
    // 更新预约状态为已取消
    await db.collection('appointments').doc(id).update({
      data: {
        status: '已取消'
      }
    })
    
    return {
      success: true,
      message: '预约取消成功'
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