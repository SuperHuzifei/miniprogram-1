// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { oldPassword, newPassword } = event
  
  if (!oldPassword || !newPassword) {
    return {
      success: false,
      message: '旧密码和新密码不能为空'
    }
  }
  
  try {
    // 验证旧密码
    let isOldPasswordValid = false
    
    try {
      const adminConfig = await db.collection('adminConfig').doc('password').get()
      isOldPasswordValid = (oldPassword === adminConfig.data.value)
    } catch (error) {
      // 如果数据库中没有设置密码，使用默认密码
      isOldPasswordValid = (oldPassword === 'admin123')
    }
    
    if (!isOldPasswordValid) {
      return {
        success: false,
        message: '旧密码不正确'
      }
    }
    
    // 更新密码
    try {
      // 检查集合是否存在，不存在则创建
      try {
        await db.createCollection('adminConfig')
      } catch (e) {
        // 集合可能已存在，忽略错误
      }
      
      try {
        // 尝试更新现有文档
        await db.collection('adminConfig').doc('password').update({
          data: {
            value: newPassword,
            updateTime: db.serverDate()
          }
        })
      } catch (updateError) {
        // 如果文档不存在，则创建
        await db.collection('adminConfig').add({
          data: {
            _id: 'password',
            value: newPassword,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      }
      
      return {
        success: true,
        message: '密码更新成功'
      }
    } catch (error) {
      console.error('更新密码失败', error)
      return {
        success: false,
        message: '更新密码失败',
        error
      }
    }
  } catch (error) {
    console.error('更新密码失败', error)
    return {
      success: false,
      message: '更新密码失败',
      error
    }
  }
} 