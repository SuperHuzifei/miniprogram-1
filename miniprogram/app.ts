// app.ts
App<IAppOption>({
  globalData: {
    userInfo: null,
    isLogin: false
  },
  onLaunch() {
    // 初始化云环境
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-4gj9r17cf89aa844', // 云环境ID
        traceUser: true,
      });
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查用户是否已登录
    this.checkLoginStatus();
  },

  // 检查用户登录状态
  checkLoginStatus() {
    wx.cloud.callFunction({
      name: 'checkUserLogin',
      success: (res: any) => {
        const { success, isLogin, userInfo } = res.result;
        
        if (success && isLogin) {
          this.globalData.isLogin = true;
          this.globalData.userInfo = userInfo;
          
          // 触发登录成功事件，通知页面更新
          if (this.userInfoReadyCallback) {
            this.userInfoReadyCallback(userInfo);
          }
        }
      },
      fail: (err) => {
        console.error('检查登录状态失败', err);
      }
    });
  },
  
  // 用户登录方法
  userLogin(userInfo: any, callback?: Function) {
    wx.cloud.callFunction({
      name: 'userLogin',
      data: { userInfo },
      success: (res: any) => {
        const { success, userInfo: userData } = res.result;
        
        if (success) {
          this.globalData.isLogin = true;
          this.globalData.userInfo = userData;
          
          if (callback) {
            callback(true);
          }
        } else {
          if (callback) {
            callback(false);
          }
        }
      },
      fail: (err) => {
        console.error('用户登录失败', err);
        if (callback) {
          callback(false);
        }
      }
    });
  },
  
  onShow() {
    // 小程序显示时触发
  },
  onHide() {
    // 小程序隐藏时触发
  },
  
  // 用于页面获取全局数据时的回调函数
  userInfoReadyCallback: null as ((userInfo: any) => void) | null
})