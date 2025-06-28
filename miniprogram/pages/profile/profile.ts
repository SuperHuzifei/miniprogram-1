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

// 工具函数：判断是否为工作日优惠（周一至周四）
function isWorkdayDiscount(dateString: string): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const dayOfWeek = date.getDay(); // 0是周日，1-6是周一至周六
  
  // 周一至周四 (1-4) 享受工作日优惠
  return dayOfWeek >= 1 && dayOfWeek <= 4;
}

// 工具函数：计算价格
function calculateAmount(hours: number, dateString?: string, priceConfig?: any): number {
  if (hours === 0) return 0;
  
  // 优先使用传入的价格配置，其次是全局配置，最后是默认配置
  const config = priceConfig || app.globalData.priceConfig || {
    basePrice: 45, // 第一小时价格
    hourlyPrice: 35, // 后续每小时价格
    twoHoursPrice: 70, // 2小时特价
    workdayDiscount: 5, // 工作日每小时优惠金额
    workdayMaxPrice: 185, // 工作日封顶价格
    workdayMaxHours: 6, // 工作日封顶小时数
    weekendMaxPrice: 220, // 周末封顶价格
    weekendMaxHours: 8, // 周末封顶小时数
    fourHoursDiscount: 5, // 4小时优惠
    sixHoursDiscount: 10, // 6小时优惠
    sevenHoursDiscount: 10 // 7小时优惠
  };
  
  if (hours === 1) return config.basePrice; // 1小时使用基础价格
  
  // 原价计算（每小时价格）
  const originalPrice = config.basePrice + (hours - 1) * config.hourlyPrice;
  
  // 检查是否为工作日
  const isWorkday = dateString ? isWorkdayDiscount(dateString) : false;
  
  // 如果是工作日且预约达到或超过封顶小时数，直接返回工作日封顶价格
  if (isWorkday && hours >= config.workdayMaxHours) {
    return config.workdayMaxPrice; // 工作日封顶价格
  }
  
  // 优惠价格计算
  let discountedPrice = 0;
  
  if (hours === 2) {
    discountedPrice = config.twoHoursPrice; // 2小时特价
  } else if (hours === 3) {
    discountedPrice = config.twoHoursPrice + config.hourlyPrice; // 3小时 = 2小时特价 + 1小时
  } else if (hours === 4) {
    discountedPrice = config.twoHoursPrice + 2 * config.hourlyPrice - config.fourHoursDiscount; // 4小时优惠
  } else if (hours === 5) {
    discountedPrice = config.twoHoursPrice + 3 * config.hourlyPrice - config.fourHoursDiscount;
  } else if (hours === 6) {
    discountedPrice = config.twoHoursPrice + 4 * config.hourlyPrice - config.fourHoursDiscount - config.sixHoursDiscount;
  } else if (hours === 7) {
    discountedPrice = config.twoHoursPrice + 5 * config.hourlyPrice - config.fourHoursDiscount - config.sixHoursDiscount - config.sevenHoursDiscount;
  } else if (hours >= config.weekendMaxHours) {
    discountedPrice = config.weekendMaxPrice; // 周末封顶价格
  } else {
    // 其他情况，按小时计算
    discountedPrice = config.basePrice + (hours - 1) * config.hourlyPrice;
  }
  
  // 工作日优惠（周一至周四）
  let finalPrice = discountedPrice;
  
  if (isWorkday) {
    // 工作日每小时优惠
    const workdayDiscountAmount = hours * config.workdayDiscount;
    finalPrice = Math.max(discountedPrice - workdayDiscountAmount, 0); // 确保价格不小于0
  }
  
  return finalPrice;
}

Page({
  data: {
    isLogin: false,
    userInfo: null,
    appointments: [] as Appointment[],
    loading: true,
    showConfirmDialog: false,
    currentAppointmentId: '',
    priceConfig: null, // 价格配置
    loadingPriceConfig: false // 加载价格配置状态
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载价格配置
    this.loadPriceConfig();
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
            item.amount = calculateAmount(item.hours, item.date, this.data.priceConfig);
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
  
  // 加载价格配置
  async loadPriceConfig() {
    // 如果全局已有价格配置，直接使用
    if (app.globalData.priceConfig) {
      this.setData({
        priceConfig: app.globalData.priceConfig,
        loadingPriceConfig: false
      });
      return;
    }
    
    this.setData({ loadingPriceConfig: true });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'getPriceConfig'
      });
      
      const { success, data } = result.result as any;
      
      if (success && data) {
        // 更新本地和全局价格配置
        this.setData({
          priceConfig: data,
          loadingPriceConfig: false
        });
        
        app.globalData.priceConfig = data;
      } else {
        this.setData({ loadingPriceConfig: false });
      }
    } catch (error) {
      console.error('加载价格配置失败', error);
      this.setData({ loadingPriceConfig: false });
    }
  },
}); 