// pages/login/login.ts
import Message from 'tdesign-miniprogram/message/index';

const app = getApp<IAppOption>();

Page({
  data: {
    showLoginFailDialog: false,
    redirectUrl: '/pages/home/home' // 默认重定向到首页
  },
  
  onLoad(options) {
    // 如果有重定向URL，保存起来
    if (options && options.redirect) {
      this.setData({
        redirectUrl: decodeURIComponent(options.redirect)
      });
    }
  },
  
  // 处理获取用户信息
  handleGetUserProfile() {
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
              wx.switchTab({
                url: this.data.redirectUrl
              });
            }, 1000);
          } else {
            this.setData({ showLoginFailDialog: true });
          }
        });
      },
      fail: () => {
        this.setData({ showLoginFailDialog: true });
      }
    });
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
    wx.showModal({
      title: '用户协议与隐私政策',
      content: '我们非常重视您的个人信息和隐私保护。您授权后，我们将获取您的昵称、头像等信息，仅用于提供更好的预约服务体验。我们承诺不会将您的信息用于其他用途或向第三方透露。',
      showCancel: false,
      confirmText: '我知道了'
    });
  }
}); 