// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取用户的预约记录，按创建时间倒序排列
    const appointments = await db.collection('appointments')
      .where({
        openid: wxContext.OPENID
      })
      .orderBy('createTime', 'desc')
      .get()
    
    // 确保所有记录都有amount字段，如果没有则默认设置为20
    const data = appointments.data.map(item => {
      if (!item.amount) {
        // 如果没有amount字段，根据时间段数量计算默认金额
        let amount = 20; // 默认金额
        if (item.times && Array.isArray(item.times)) {
          amount = item.times.length * 20; // 每小时20元
        }
        return { ...item, amount };
      }
      return item;
    });
    
    return {
      success: true,
      data: data
    }
  } catch (err) {
    console.error('获取预约记录失败', err)
    return {
      success: false,
      message: '获取预约记录失败',
      error: err
    }
  }
} 