// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 获取轮播图配置
    try {
      const res = await db.collection('siteConfig').doc('bannerImages').get()
      
      // 将url字段转换为value字段
      const images = res.data.images.map(item => ({
        ...item,
        value: item.url
      }));
      
      // 返回轮播图数据
      return {
        success: true,
        data: {
          images
        }
      }
    } catch (error) {
      // 如果没有配置数据，返回默认值
      return {
        success: true,
        data: {
          images: [
            { url: '/assets/images/banner1.jpg', value: '/assets/images/banner1.jpg' },
            { url: '/assets/images/banner2.jpg', value: '/assets/images/banner2.jpg' },
            { url: '/assets/images/banner3.jpg', value: '/assets/images/banner3.jpg' }
          ]
        }
      }
    }
  } catch (error) {
    console.error('获取轮播图失败', error)
    return {
      success: false,
      message: '获取轮播图失败',
      error
    }
  }
} 