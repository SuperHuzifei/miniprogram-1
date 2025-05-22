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
        image: '/assets/images/banner1.jpg',
      },
      {
        image: '/assets/images/banner2.jpg',
      },
      {
        image: '/assets/images/banner3.jpg',
      },
    ],
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
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
  }
}); 