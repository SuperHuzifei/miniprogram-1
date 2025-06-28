// app.ts
App<IAppOption>({
  globalData: {
    userInfo: null,
    isLogin: false,
    priceConfig: null // 添加价格配置全局变量
  },
  onLaunch() {
    // 初始化云环境
    if (wx.cloud) {
      wx.cloud.init({
        env: wx.cloud.DYNAMIC_CURRENT_ENV, // 使用动态环境ID
        traceUser: true,
      });
      
      // 调用初始化云函数
      this.initializeApp();
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    }

    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 检查用户是否已登录
    this.checkLoginStatus();
    
    // 加载价格配置
    this.loadPriceConfig();
  },
  
  // 初始化应用
  initializeApp() {
    wx.cloud.callFunction({
      name: 'initializeApp',
      success: (res: any) => {
        console.log('应用初始化成功', res.result);
      },
      fail: (err) => {
        console.error('应用初始化失败', err);
      }
    });
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
  
  // 加载价格配置
  loadPriceConfig() {
    wx.cloud.callFunction({
      name: 'getPriceConfig',
      success: (res: any) => {
        const { success, data } = res.result;
        
        if (success && data) {
          this.globalData.priceConfig = data;
          
          // 触发价格配置更新事件
          if (this.priceConfigReadyCallback) {
            this.priceConfigReadyCallback(data);
          }
        }
      },
      fail: (err) => {
        console.error('加载价格配置失败', err);
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
  
  // 更新用户信息
  updateUserInfo(userInfo: any) {
    this.globalData.userInfo = userInfo;
    
    // 触发更新事件，通知页面更新
    if (this.userInfoReadyCallback) {
      this.userInfoReadyCallback(userInfo);
    }
  },
  
  onShow() {
    // 小程序显示时触发
  },
  onHide() {
    // 小程序隐藏时触发
  },
  
  // 用于页面获取全局数据时的回调函数
  userInfoReadyCallback: null as ((userInfo: any) => void) | null,
  priceConfigReadyCallback: null as ((priceConfig: any) => void) | null
})