// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 默认管理员密码，仅在数据库中没有设置密码时使用
const DEFAULT_PASSWORD = "admin123"

// 云函数入口函数
exports.main = async (event, context) => {
  const { password } = event
  
  if (!password) {
    return {
      isAdmin: false
    }
  }
  
  try {
    // 从数据库中查询密码
    try {
      const adminConfig = await db.collection('adminConfig').doc('password').get()
      if (password === adminConfig.data.value) {
        return { isAdmin: true }
      }
    } catch (error) {
      // 如果数据库中没有设置密码，使用默认密码
      if (password === DEFAULT_PASSWORD) {
        // 创建默认密码到数据库
        try {
          // 检查集合是否存在，不存在则创建
          try {
            await db.createCollection('adminConfig')
          } catch (e) {
            // 集合可能已存在，忽略错误
          }
          
          // 创建密码文档
          await db.collection('adminConfig').add({
            data: {
              _id: 'password',
              value: DEFAULT_PASSWORD,
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          })
        } catch (createError) {
          console.error('创建默认管理员密码失败', createError)
        }
        
        return { isAdmin: true }
      }
    }
    
    return {
      isAdmin: false
    }
  } catch (error) {
    console.error('检查管理员权限失败', error)
    return {
      isAdmin: false,
      error
    }
  }
} 