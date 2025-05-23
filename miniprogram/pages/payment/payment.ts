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
    customerServiceWechat: 'roomservice2024' // 客服微信号，可根据需要修改
  },
  
  onLoad(options) {
    const { appointmentId, amount, hours } = options;
    
    if (!appointmentId) {
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
      amount: Number(amount) || 0,
      hours: Number(hours) || 1
    });
  },
  
  // 复制客服微信号
  copyWechatId() {
    wx.setClipboardData({
      data: this.data.customerServiceWechat,
      success: () => {
        Message.success({
          context: this,
          offset: [20, 32],
          duration: 2000,
          content: '客服微信号已复制'
        });
      }
    });
  },
  
  // 暂时关闭页面
  closeReservation() {
    wx.navigateBack();
  },
  
  // 取消预约
  cancelReservation() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此次预约吗？',
      confirmText: '确定取消',
      cancelText: '继续预约',
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
  },
  
  // 预览二维码图片
  previewQRCode() {
    wx.previewImage({
      urls: [this.data.qrCodeUrl]
    }).catch(() => {
      wx.showToast({
        title: '长按图片可保存并识别',
        icon: 'none',
        duration: 2000
      });
    });
  }
}); 