// pages/reservation/reservation.js
import Message from 'tdesign-miniprogram/message/index';

const app = getApp();

Page({
  data: {
    appointment: null,
    loading: true,
    amount: 0,
    hours: 1,
    showConfirmPayDialog: false,
    showSuccessDialog: false,
    showCancelDialog: false,
    wechatNumber: 'Huzifei1' // 客服微信号
  },
  
  onLoad(options) {
    // 获取参数
    const { appointmentId, amount, hours } = options;
    
    if (!appointmentId) {
      this.showError('预约信息获取失败');
      return;
    }
    
    this.setData({
      amount: amount || 0,
      hours: hours || 1
    });
    
    // 获取预约详情
    this.fetchAppointmentDetail(appointmentId);
  },
  
  // 获取预约详情
  fetchAppointmentDetail(appointmentId) {
    this.setData({ loading: true });
    
    wx.cloud.callFunction({
      name: 'getAppointments',
      data: { appointmentId },
      success: (res) => {
        const { data } = res.result;
        
        if (data && data.length > 0) {
          const appointment = data[0];
          
          // 格式化日期和时间
          const dateObj = new Date(appointment.date);
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth() + 1;
          const day = dateObj.getDate();
          
          appointment.dateFormatted = `${year}年${month}月${day}日`;
          
          // 格式化时间段
          if (appointment.times && appointment.times.length > 0) {
            const firstTime = appointment.times[0];
            const lastTime = appointment.times[appointment.times.length - 1];
            
            if (appointment.times.length === 1) {
              appointment.timeFormatted = firstTime;
            } else {
              const startTime = firstTime.split('-')[0];
              const endTime = lastTime.split('-')[1];
              appointment.timeFormatted = `${startTime}-${endTime}`;
            }
          }
          
          this.setData({
            appointment,
            loading: false
          });
        } else {
          this.showError('预约信息获取失败');
        }
      },
      fail: (err) => {
        console.error('获取预约详情失败', err);
        this.showError('获取预约详情失败');
      }
    });
  },
  
  // 显示支付确认对话框
  showPayConfirmDialog() {
    this.setData({
      showConfirmPayDialog: true
    });
  },
  
  // 关闭支付确认对话框
  closePayConfirmDialog() {
    this.setData({
      showConfirmPayDialog: false
    });
  },
  
  // 确认支付
  confirmPayment() {
    this.closePayConfirmDialog();
    
    // 显示正在处理
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 模拟支付流程
    setTimeout(() => {
      wx.hideLoading();
      
      // 显示支付成功对话框
      this.setData({
        showSuccessDialog: true
      });
    }, 1500);
  },
  
  // 关闭成功对话框
  closeSuccessDialog() {
    this.setData({
      showSuccessDialog: false
    });
    
    // 返回个人中心页面
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },
  
  // 显示取消预约对话框
  showCancelDialog() {
    this.setData({
      showCancelDialog: true
    });
  },
  
  // 关闭取消预约对话框
  closeCancelDialog() {
    this.setData({
      showCancelDialog: false
    });
  },
  
  // 取消预约
  cancelAppointment() {
    // 关闭对话框
    this.closeCancelDialog();
    
    // 显示加载提示
    wx.showLoading({
      title: '处理中...',
      mask: true
    });
    
    // 调用云函数取消预约
    wx.cloud.callFunction({
      name: 'cancelAppointment',
      data: {
        id: this.data.appointment._id
      },
      success: (res) => {
        wx.hideLoading();
        
        const { success, message } = res.result || {};
        
        if (success) {
          Message.success({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '预约已取消'
          });
          
          // 2秒后返回个人中心页面
          setTimeout(() => {
            wx.switchTab({
              url: '/pages/profile/profile'
            });
          }, 2000);
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 3000,
            content: message || '取消预约失败，请重试'
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
          content: '取消预约失败，请重试'
        });
      }
    });
  },
  
  // 复制微信号
  copyWechatNumber() {
    wx.setClipboardData({
      data: this.data.wechatNumber,
      success: () => {
        Message.success({
          context: this,
          offset: [20, 32],
          duration: 2000,
          content: '微信号已复制'
        });
      }
    });
  },
  
  // 返回上一页
  navigateBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({
          url: '/pages/profile/profile'
        });
      }
    });
  },
  
  // 显示错误信息
  showError(message) {
    this.setData({ loading: false });
    
    Message.error({
      context: this,
      offset: [20, 32],
      duration: 3000,
      content: message
    });
    
    // 两秒后返回
    setTimeout(() => {
      this.navigateBack();
    }, 2000);
  }
}); 