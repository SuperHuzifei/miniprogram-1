// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 计算价格函数
function calculateAmount(hours) {
  if (hours === 1) {
    return 45; // 1小时45元
  } else if (hours > 1) {
    return hours * 35; // 多于1小时，每小时35元
  }
  return 0;
}

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
        processedItem.amount = calculateAmount(processedItem.hours);
      }
      
      // 确保status字段存在
      if (!processedItem.status) {
        processedItem.status = '待提交';
      }
      
      // 确保doorPassword字段存在（如果状态是已确认）
      if (processedItem.status === '已确认' && !processedItem.doorPassword) {
        processedItem.doorPassword = '请联系客服获取';
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