// pages/login/login.ts
import Message from 'tdesign-miniprogram/message/index';

const app = getApp<IAppOption>();

Page({
  data: {
    showLoginFailDialog: false,
    redirectUrl: '/pages/home/home', // 默认重定向到首页
    privacyChecked: false, // 添加隐私政策勾选状态
    showPrivacyDialog: false // 添加隐私政策弹窗显示状态
  },
  
  onLoad(options) {
    // 如果有重定向URL，保存起来
    if (options && options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      });
    }
    
    // 检查是否已经登录
    if (app.globalData.isLogin && app.globalData.userInfo) {
      this.navigateToRedirect();
    }
  },
  
  // 处理获取用户信息
  handleGetUserProfile() {
    // 检查用户是否已同意隐私政策
    if (!this.data.privacyChecked) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请先阅读并同意《用户协议与隐私政策》'
      });
      return;
    }
    
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        // 确保用户信息中包含nickname字段
        const userInfo = {
          ...res.userInfo,
          nickname: res.userInfo.nickName // 添加nickname字段以确保一致性
        };
        
        // 获取用户信息成功，调用登录接口
        app.userLogin(userInfo, (success: boolean) => {
          if (success) {
            Message.success({
              context: this,
              offset: [20, 32],
              duration: 2000,
              content: '登录成功'
            });
            
            // 登录成功后跳转到指定页面
            setTimeout(() => {
              this.navigateToRedirect();
            }, 1000);
          } else {
            this.setData({ showLoginFailDialog: true });
          }
        });
      },
      fail: (err) => {
        console.error('获取用户信息失败', err);
        this.setData({ showLoginFailDialog: true });
      }
    });
  },
  
  // 导航到重定向页面
  navigateToRedirect() {
    const { redirectUrl } = this.data;
    
    // 判断是否是 tabBar 页面
    const tabBarPages = ['/pages/home/home', '/pages/appointment/appointment', '/pages/profile/profile'];
    
    if (tabBarPages.includes(redirectUrl)) {
      wx.switchTab({
        url: redirectUrl,
        fail: (err) => {
          console.error('跳转失败', err);
          wx.switchTab({
            url: '/pages/home/home'
          });
        }
      });
    } else {
      wx.navigateTo({
        url: redirectUrl,
        fail: (err) => {
          console.error('跳转失败', err);
          wx.switchTab({
            url: '/pages/home/home'
          });
        }
      });
    }
  },
  
  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }
    });
  },
  
  // 显示隐私政策
  showPrivacyPolicy() {
    this.setData({
      showPrivacyDialog: true
    });
  },
  
  // 关闭隐私政策弹窗
  closePrivacyDialog() {
    this.setData({
      showPrivacyDialog: false
    });
  },
  
  // 切换隐私政策勾选状态
  togglePrivacyCheck() {
    this.setData({
      privacyChecked: !this.data.privacyChecked
    });
  },
  
  // 同意隐私政策
  agreePrivacy() {
    this.setData({
      privacyChecked: true,
      showPrivacyDialog: false
    });
  }
}); 