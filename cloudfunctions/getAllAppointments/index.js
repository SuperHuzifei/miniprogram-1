// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  const { skip = 0, limit = 10, searchValue = '', statusFilter = '' } = event
  
  try {
    // 构建查询条件
    let query = {}
    
    // 如果有状态筛选
    if (statusFilter) {
      query.status = statusFilter
    }
    
    // 如果有搜索值，添加模糊搜索条件
    if (searchValue) {
      // 支持按日期、电话、ID搜索
      query = {
        ...query,
        ...db.command.or([
          {
            date: db.RegExp({
              regexp: searchValue,
              options: 'i'
            })
          },
          {
            phone: db.RegExp({
              regexp: searchValue,
              options: 'i'
            })
          },
          {
            _id: db.RegExp({
              regexp: searchValue,
              options: 'i'
            })
          }
        ])
      }
    }
    
    // 获取预约总数
    const countResult = await db.collection('appointments').where(query).count()
    const total = countResult.total
    
    // 获取预约数据
    const appointmentsResult = await db.collection('appointments')
      .where(query)
      .skip(skip)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()
    
    // 获取所有预约中包含的用户 openid
    const openids = [...new Set(appointmentsResult.data.map(item => item.openid))]
    
    // 批量获取用户信息
    const userInfoMap = {}
    if (openids.length > 0) {
      const userResult = await db.collection('users')
        .where({
          openid: db.command.in(openids)
        })
        .get()
      
      // 构建用户信息映射
      userResult.data.forEach(user => {
        userInfoMap[user.openid] = {
          nickname: user.nickname,
          avatarUrl: user.avatarUrl
        }
      })
    }
    
    // 为预约添加用户信息和用户名
    const appointmentsWithUserInfo = appointmentsResult.data.map(item => {
      const userInfo = userInfoMap[item.openid] || null;
      return {
        ...item,
        userInfo,
        userName: userInfo ? userInfo.nickname : '未知用户'
      }
    })
    
    return {
      success: true,
      appointments: appointmentsWithUserInfo,
      total
    }
  } catch (error) {
    console.error('获取预约列表失败', error)
    return {
      success: false,
      message: '获取预约列表失败',
      error,
      appointments: [],
      total: 0
    }
  }
} 