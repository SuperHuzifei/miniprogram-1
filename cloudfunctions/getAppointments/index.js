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
    
    // 处理数据，确保前端显示所需的字段都存在
    const data = appointments.data.map(item => {
      const processedItem = { ...item };
      
      // 为前端计算金额（如果不存在）
      if (!processedItem.amount && processedItem.hours) {
        processedItem.amount = processedItem.hours * 20; // 每小时20元
      }
      
      // 确保status字段存在
      if (!processedItem.status) {
        processedItem.status = '待提交';
      }
      
      return processedItem;
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