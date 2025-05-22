import Message from 'tdesign-miniprogram/message/index';

// 支付码图片，根据不同时长使用不同的收款码
const PAYMENT_QR_CODES = {
  1: '/assets/payment/qr_1h.png',
  2: '/assets/payment/qr_2h.png',
  3: '/assets/payment/qr_3h.png',
  4: '/assets/payment/qr_4h.png',
  5: '/assets/payment/qr_5h.png',
  6: '/assets/payment/qr_6h.png'
};

Page({
  data: {
    appointmentId: '',
    amount: 0,
    hours: 0,
    qrCodeUrl: ''
  },
  
  onLoad(options) {
    const { appointmentId, amount, hours } = options;
    
    if (!appointmentId || !hours) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 3000,
        content: '参数错误'
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
      return;
    }
    
    // 设置数据
    this.setData({
      appointmentId,
      amount: Number(amount),
      hours: Number(hours),
      qrCodeUrl: PAYMENT_QR_CODES[Number(hours)] || PAYMENT_QR_CODES[1] // 默认使用1小时的收款码
    });
  },
  
  // 用户确认已完成支付
  confirmPayment() {
    wx.showLoading({ title: '提交中...' });
    
    // 调用云函数标记用户已完成支付（等待后台确认）
    wx.cloud.callFunction({
      name: 'confirmPayment',
      data: {
        appointmentId: this.data.appointmentId
      },
      success: (res: any) => {
        wx.hideLoading();
        
        const { success, message } = res.result;
        
        if (success) {
          Message.success({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '已提交支付确认，待管理员审核'
          });
          
          // 延迟返回
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/profile/profile'
            });
          }, 2000);
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 3000,
            content: message || '操作失败，请重试'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('确认支付失败', err);
        
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 3000,
          content: '操作失败，请重试'
        });
      }
    });
  },
  
  // 取消支付，返回上一页
  cancelPayment() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此次预约吗？',
      confirmText: '确定取消',
      cancelText: '继续支付',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '取消中...' });
          
          // 调用云函数取消预约
          wx.cloud.callFunction({
            name: 'cancelAppointment',
            data: {
              id: this.data.appointmentId
            },
            success: (res: any) => {
              wx.hideLoading();
              
              const { success, message } = res.result;
              
              if (success) {
                Message.success({
                  context: this,
                  offset: [20, 32],
                  duration: 2000,
                  content: '已取消预约'
                });
                
                // 延迟返回
                setTimeout(() => {
                  wx.navigateBack();
                }, 1500);
              } else {
                Message.error({
                  context: this,
                  offset: [20, 32],
                  duration: 3000,
                  content: message || '取消失败，请重试'
                });
              }
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('取消预约失败', err);
              
              Message.error({
                context: this,
                offset: [20, 32],
                duration: 3000,
                content: '取消失败，请重试'
              });
            }
          });
        }
      }
    });
  }
}); 