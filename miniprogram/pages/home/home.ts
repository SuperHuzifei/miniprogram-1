// pages/home/home.ts
const app = getApp<IAppOption>();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    current: 0,
    autoplay: true,
    duration: 500,
    interval: 5000,
    swiperList: [
      {
        value: '/assets/images/banner1.jpg',
      },
      {
        value: '/assets/images/banner2.jpg',
      },
      {
        value: '/assets/images/banner3.jpg',
      },
    ],
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载轮播图
    this.loadBannerImages();
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },
  
  // 检查登录状态
  checkLoginStatus() {
    // 从全局获取登录状态
    const { isLogin, userInfo } = app.globalData;
    
    this.setData({
      isLogin,
      userInfo
    });
  },
  
  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/home/home')
    });
  },
  
  // 跳转到预约页面
  goToAppointment() {
    if (this.data.isLogin) {
      wx.switchTab({
        url: '/pages/appointment/appointment'
      });
    } else {
      wx.navigateTo({
        url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/appointment/appointment')
      });
    }
  },
  
  // 加载轮播图
  async loadBannerImages() {
    try {
      // 调用云函数获取轮播图配置
      try {
        const res = await wx.cloud.callFunction({
          name: 'getBannerImages'
        });
        
        if (res.result && res.result.success && res.result.data && res.result.data.images && res.result.data.images.length > 0) {
          // 转换成swiper需要的格式
          const swiperList = res.result.data.images.map(item => ({
            value: item.url
          }));
          
          this.setData({ swiperList });
          console.log('从云函数加载轮播图成功', swiperList);
        } else {
          throw new Error('云函数返回数据为空');
        }
      } catch (cloudFunctionError) {
        console.error('调用云函数失败，尝试直接从数据库获取', cloudFunctionError);
        
        // 尝试直接从数据库获取
        const db = wx.cloud.database();
        try {
          const configRes = await db.collection('siteConfig').doc('bannerImages').get();
          
          if (configRes && configRes.data && configRes.data.images && configRes.data.images.length > 0) {
            // 转换成swiper需要的格式
            const swiperList = configRes.data.images.map(item => ({
              value: item.url
            }));
            
            this.setData({ swiperList });
            console.log('从数据库加载轮播图成功', swiperList);
          } else {
            console.log('数据库中无轮播图配置，使用默认轮播图');
          }
        } catch (dbError) {
          console.error('从数据库获取轮播图失败，使用默认轮播图', dbError);
        }
      }
    } catch (error) {
      console.error('加载轮播图失败', error);
      // 使用默认轮播图
    }
  }
}); 