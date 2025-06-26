// pages/profile/profile.ts
import { IAppOption } from '../../app';
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
  hours: number;
  amount?: number;
  statusClass?: string;
}

interface EventData {
  currentTarget: {
    dataset: {
      id: string;
      amount?: number;
      hours?: number;
    }
  }
}

// 工具函数：格式化日期
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${year}年${month}月${day}日`;
}

// 工具函数：格式化手机号
function formatPhone(phone: string): string {
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

// 工具函数：格式化时间段
function formatTimeSlots(times: string[]): string {
  if (!times || times.length === 0) return '';
  
  const firstTime = times[0];
  const lastTime = times[times.length - 1];
  
  if (times.length === 1) {
    // 只有一个时间段
    return firstTime;
  } else {
    // 多个时间段，显示第一个时间段的开始时间到最后一个时间段的结束时间
    const startTime = firstTime.split('-')[0];
    const endTime = lastTime.split('-')[1];
    return `${startTime}-${endTime}`;
  }
}

// 工具函数：获取状态样式类
function getStatusClass(status: string): string {
  if (!status) return '';
  
  if (status.includes('待审核')) {
    return 'status-reviewing';
  } else if (status.includes('已确认')) {
    return 'status-success';
  } else if (status.includes('已取消')) {
    return 'status-canceled';
  }
  return '';
}

// 工具函数：计算价格
function calculateAmount(hours: number): number {
  if (hours === 0) return 0;
  if (hours === 1) return 45; // 1小时45元
  
  // 优惠价格计算
  if (hours === 2) {
    return 70; // 前2小时70元
  } else if (hours === 3) {
    return 105; // 3小时 = 70 + 35
  } else if (hours === 4) {
    return 135; // 4小时 = 70 + 35 + 35 - 5
  } else if (hours === 5) {
    return 170; // 5小时 = 135 + 35
  } else if (hours === 6) {
    return 195; // 6小时 = 170 + 35 - 10
  } else if (hours === 7) {
    return 220; // 7小时 = 195 + 35 - 10
  } else if (hours >= 8) {
    return 220; // 8小时及以上封顶220元
  }
  
  return hours * 35; // 默认情况，每小时35元
}

Page({
  data: {
    isLogin: false,
    userInfo: null,
    appointments: [] as Appointment[],
    loading: true,
    showConfirmDialog: false,
    currentAppointmentId: ''
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
          // 使用工具函数格式化数据
          const dateFormatted = formatDate(item.date);
          const phoneFormatted = formatPhone(item.phone);
          const timeFormatted = formatTimeSlots(item.times);
          const statusClass = getStatusClass(item.status);
          
          // 如果没有金额，根据小时数计算
          if (!item.amount && item.hours) {
            item.amount = calculateAmount(item.hours);
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
  
  // 跳转到预约详情
  goReservation(e) {
    const { id, amount, hours } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/reservation/reservation?appointmentId=${id}&amount=${amount}&hours=${hours || 1}`
    });
  },
  
  // 跳转到管理员页面
  goToAdmin() {
    // 如果未登录，提示先登录
    if (!this.data.isLogin) {
      Message.info({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请先登录'
      });
      return;
    }
    
    // 跳转到管理员页面
    wx.navigateTo({
      url: '/packageA/pages/admin/admin',
      fail: (err) => {
        console.error('跳转到管理员页面失败', err);
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 2000,
          content: '页面跳转失败'
        });
      }
    });
  },
  
  // 复制密码
  copyPassword(e: any) {
    const password = e.currentTarget.dataset.password;
    
    wx.setClipboardData({
      data: password,
      success: () => {
        Message.success({
          context: this,
          offset: [20, 32],
          duration: 2000,
          content: '密码已复制'
        });
      }
    });
  },
  
  // 显示编辑用户名对话框
  showEditNameDialog() {
    // 设置初始值为当前用户名
    const currentNickname = this.data.userInfo?.nickname || '';
    
    // 使用微信原生对话框，包含输入框
    wx.showModal({
      title: '修改用户名',
      editable: true,
      placeholderText: '请输入新的用户名',
      content: currentNickname,
      success: (res) => {
        if (res.confirm) {
          const newNickname = res.content.trim();
          if (!newNickname) {
            Message.error({
              context: this,
              offset: [20, 32],
              duration: 2000,
              content: '用户名不能为空'
            });
            return;
          }
          
          // 如果用户名没有变化，直接返回
          if (newNickname === currentNickname) {
            return;
          }
          
          this.updateUserName(newNickname);
        }
      }
    });
  },
  
  // 更新用户名
  updateUserName(newNickname) {
    wx.showLoading({ title: '更新中...' });
    
    // 调用云函数更新用户名
    wx.cloud.callFunction({
      name: 'updateUserName',
      data: { nickname: newNickname },
      success: (res: any) => {
        wx.hideLoading();
        
        const { success, message, userInfo } = res.result;
        
        if (success) {
          // 更新全局用户信息
          app.globalData.userInfo = userInfo;
          
          // 更新本地用户信息
          this.setData({
            userInfo: userInfo
          });
          
          Message.success({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '用户名修改成功'
          });
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: message || '用户名修改失败'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('更新用户名失败', err);
        
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 2000,
          content: '更新用户名失败'
        });
      }
    });
  },
}); 