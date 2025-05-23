// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  const { skip = 0, limit = 10, searchValue = '' } = event
  
  try {
    // 构建查询条件
    let query = {}
    
    // 如果有搜索值，添加模糊搜索条件
    if (searchValue) {
      query = db.command.or([
        {
          nickname: db.RegExp({
            regexp: searchValue,
            options: 'i'
          })
        },
        {
          openid: db.RegExp({
            regexp: searchValue,
            options: 'i'
          })
        }
      ])
    }
    
    // 获取用户总数
    const countResult = await db.collection('users').where(query).count()
    const total = countResult.total
    
    // 获取用户数据
    const usersResult = await db.collection('users')
      .where(query)
      .skip(skip)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()
    
    // 确保返回的用户数据包含头像和昵称
    const users = usersResult.data.map(user => {
      return {
        ...user,
        avatarUrl: user.avatarUrl || '/assets/icons/default-avatar.png',
        nickname: user.nickname || '未设置昵称',
        gender: user.gender || 0 // 确保性别信息存在，如果没有则默认为0（未知）
      };
    });
    
    return {
      success: true,
      users,
      total
    }
  } catch (error) {
    console.error('获取用户列表失败', error)
    return {
      success: false,
      message: '获取用户列表失败',
      error,
      users: [],
      total: 0
    }
  }
} 