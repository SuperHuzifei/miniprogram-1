// pages/profile/profile.ts
import Message from 'tdesign-miniprogram/message/index';

const app = getApp<IAppOption>();

interface Appointment {
  _id: string;
  date: string;
  times: string[]; // 时间段数组
  phone: string;
  dateFormatted?: string;
  phoneFormatted?: string;
  timeFormatted?: string; // 格式化后的时间显示
  status: string;
  isCanceled: boolean;
  hours: number;
  amount?: number;
  statusClass?: string;
}

interface EventData {
  currentTarget: {
    dataset: {
      id: string;
    }
  }
}

Page({
  data: {
    isLogin: false,
    userInfo: null,
    appointments: [] as Appointment[],
    loading: true,
    showConfirmDialog: false,
    currentAppointmentId: '',
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
    
    // 如果已登录，获取预约记录
    if (this.data.isLogin) {
      this.fetchAppointments();
    }
  },
  
  // 检查登录状态
  checkLoginStatus() {
    // 从全局获取登录状态
    const { isLogin, userInfo } = app.globalData;
    
    this.setData({
      isLogin,
      userInfo
    });
    
    // 如果已登录且有用户信息，获取预约记录
    if (isLogin && userInfo) {
      this.fetchAppointments();
    } else {
      this.setData({ loading: false });
    }
  },
  
  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/profile/profile')
    });
  },
  
  fetchAppointments() {
    // 如果未登录，不获取预约记录
    if (!this.data.isLogin) {
      this.setData({ loading: false });
      return;
    }
    
    this.setData({ loading: true });
    
    // 调用云函数获取当前用户的预约记录
    wx.cloud.callFunction({
      name: 'getAppointments',
      success: (res: any) => {
        const { data } = res.result as { data: Appointment[] };
        
        // 格式化数据
        const formattedAppointments = data.map(item => {
          const [year, month, day] = item.date.split('-');
          const dateFormatted = `${year}年${month}月${day}日`;
          
          // 格式化手机号，中间部分用 * 替代
          const phone = item.phone;
          const phoneFormatted = phone.substring(0, 3) + '****' + phone.substring(7);
          
          // 格式化时间段显示
          let timeFormatted = '';
          if (item.times && item.times.length > 0) {
            // 处理多时间段数组
            // 如果是连续的时间段，只显示开始和结束时间
            const firstTime = item.times[0];
            const lastTime = item.times[item.times.length - 1];
            
            if (item.times.length === 1) {
              // 只有一个时间段
              timeFormatted = firstTime;
            } else {
              // 多个时间段，显示第一个时间段的开始时间到最后一个时间段的结束时间
              const startTime = firstTime.split('-')[0];
              const endTime = lastTime.split('-')[1];
              timeFormatted = `${startTime}-${endTime}`;
            }
          }
          
          // 根据预约状态设置样式类
          let statusClass = '';
          if (item.status) {
            if (item.status.includes('待提交')) {
              statusClass = 'status-waiting';
            } else if (item.status.includes('待审核')) {
              statusClass = 'status-reviewing';
            } else if (item.status.includes('已确认')) {
              statusClass = 'status-success';
            } else if (item.status.includes('已取消')) {
              statusClass = 'status-canceled';
            }
          }
          
          // 如果没有金额，根据小时数计算
          if (!item.amount && item.hours) {
            item.amount = item.hours * 20; // 每小时20元
          }
          
          return {
            ...item,
            dateFormatted,
            phoneFormatted,
            timeFormatted,
            statusClass
          };
        });
        
        this.setData({
          appointments: formattedAppointments,
          loading: false
        });
      },
      fail: (err) => {
        console.error('获取预约记录失败', err);
        this.setData({ loading: false });
        
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 3000,
          content: '获取预约记录失败'
        });
      }
    });
  },
  
  // 取消预约（显示确认对话框）
  cancelAppointment(e: EventData) {
    const id = e.currentTarget.dataset.id;
    
    this.setData({
      showConfirmDialog: true,
      currentAppointmentId: id
    });
  },
  
  // 确认取消预约
  confirmCancel() {
    const id = this.data.currentAppointmentId;
    
    wx.showLoading({ title: '处理中...' });
    
    // 调用云函数取消预约
    wx.cloud.callFunction({
      name: 'cancelAppointment',
      data: { id },
      success: (res: any) => {
        wx.hideLoading();
        
        const { success, message } = res.result;
        
        if (success) {
          Message.success({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: message || '取消预约成功'
          });
          
          // 重新获取预约列表
          this.fetchAppointments();
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 3000,
            content: message || '取消预约失败'
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
          content: '取消预约失败'
        });
      }
    });
    
    this.setData({ showConfirmDialog: false });
  },
  
  // 关闭对话框
  closeDialog() {
    this.setData({ showConfirmDialog: false });
  },
  
  // 跳转到预约页面
  goToAppointment() {
    wx.switchTab({
      url: '/pages/appointment/appointment'
    });
  },
  
  // 去支付
  goPay(e) {
    const { id, amount, hours } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/payment/payment?appointmentId=${id}&amount=${amount}&hours=${hours || 1}`
    });
  }
}); 