import { formatDate } from '../../utils/util';
import Message from 'tdesign-miniprogram/message/index';

const app = getApp<IAppOption>();

Page({
  data: {
    isLogin: false,
    userInfo: null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1, // 月份从1开始
    calendarDays: [],
    selectedDate: null,
    selectedDateFormatted: '',
    timeSlots: [
      { time: '10:00-11:00', isAvailable: true, isSelected: false },
      { time: '11:00-12:00', isAvailable: true, isSelected: false },
      { time: '12:00-13:00', isAvailable: true, isSelected: false },
      { time: '13:00-14:00', isAvailable: true, isSelected: false },
      { time: '14:00-15:00', isAvailable: true, isSelected: false },
      { time: '15:00-16:00', isAvailable: true, isSelected: false },
      { time: '16:00-17:00', isAvailable: true, isSelected: false },
      { time: '17:00-18:00', isAvailable: true, isSelected: false },
      { time: '18:00-19:00', isAvailable: true, isSelected: false },
      { time: '19:00-20:00', isAvailable: true, isSelected: false },
      { time: '20:00-21:00', isAvailable: true, isSelected: false },
      { time: '21:00-22:00', isAvailable: true, isSelected: false },
      { time: '22:00-23:00', isAvailable: true, isSelected: false },
      { time: '23:00-23:59', isAvailable: true, isSelected: false },
    ],
    selectedTimeSlots: [], // 选中的时间段索引数组
    phoneNumber: '',
    loadingTimeSlots: false,
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
    this.generateCalendar();
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
    
    // 如果已选择日期，重新获取时间段
    if (this.data.selectedDate) {
      this.fetchTimeSlots(this.data.selectedDate);
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
  },
  
  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login?redirect=' + encodeURIComponent('/pages/appointment/appointment')
    });
  },
  
  // 生成日历数据
  generateCalendar() {
    const year = this.data.year;
    const month = this.data.month;
    const firstDay = new Date(year, month - 1, 1).getDay(); // 本月第一天是星期几
    const lastDate = new Date(year, month, 0).getDate(); // 本月最后一天
    const prevMonthLastDate = new Date(year, month - 1, 0).getDate(); // 上个月最后一天
    
    let days = [];
    
    // 上个月的日期
    for (let i = 0; i < firstDay; i++) {
      const day = prevMonthLastDate - firstDay + i + 1;
      let prevMonth = month - 1;
      let prevYear = year;
      
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear--;
      }
      
      days.push({
        day,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        isAvailable: false,
        isSelected: false
      });
    }
    
    // 当前月的日期
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    for (let i = 1; i <= lastDate; i++) {
      // 只有当前日期及以后的日期才可预约
      const isAvailable = (year > currentYear) || 
                         (year === currentYear && month > currentMonth) || 
                         (year === currentYear && month === currentMonth && i >= currentDay);
      
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true,
        isAvailable,
        isSelected: false
      });
    }
    
    // 下个月的日期（填充到42个，即6行）
    const remainingDays = 42 - days.length;
    let nextMonth = month + 1;
    let nextYear = year;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }
    
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        isAvailable: false,
        isSelected: false
      });
    }
    
    this.setData({
      calendarDays: days
    });
  },
  
  // 获取指定日期的可用时间段
  fetchTimeSlots(selectedDate) {
    if (!selectedDate) return;
    
    this.setData({ loadingTimeSlots: true });
    
    // 格式化日期为 YYYY-MM-DD 格式
    const { year, month, day } = selectedDate;
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 调用云函数获取可用时间段
    wx.cloud.callFunction({
      name: 'getTimeSlots',
      data: { date: formattedDate },
      success: (res: any) => {
        const { success, data } = res.result;
        
        if (success) {
          // 添加isSelected属性
          const timeSlots = data.map(slot => ({
            ...slot,
            isSelected: false
          }));
          
          this.setData({
            timeSlots,
            loadingTimeSlots: false,
            selectedTimeSlots: []
          });
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 3000,
            content: '获取可用时间段失败'
          });
          this.setData({ loadingTimeSlots: false });
        }
      },
      fail: (err) => {
        console.error('获取可用时间段失败', err);
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 3000,
          content: '获取可用时间段失败'
        });
        this.setData({ loadingTimeSlots: false });
      }
    });
  },
  
  // 选择日期
  selectDate(e) {
    // 如果未登录，提示用户登录
    if (!this.data.isLogin) {
      Message.info({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请先登录后再进行预约'
      });
      return;
    }
    
    const { day, month, year } = e.currentTarget.dataset;
    
    // 只有当前月的日期才能选择
    if (month !== this.data.month || year !== this.data.year) {
      return;
    }
    
    // 检查日期是否可用
    const calendarDays = this.data.calendarDays.map(item => {
      if (item.day === day && item.month === month && item.year === year) {
        // 如果该日期不可用，则不允许选择
        if (!item.isAvailable) return item;
        
        return { ...item, isSelected: true };
      }
      return { ...item, isSelected: false };
    });
    
    const selectedDate = { day, month, year };
    const formattedDate = `${year}年${month}月${day}日`;
    
    this.setData({
      calendarDays,
      selectedDate,
      selectedDateFormatted: formattedDate,
      selectedTimeSlots: []
    });
    
    // 获取该日期的可用时间段
    this.fetchTimeSlots(selectedDate);
  },
  
  // 选择时间段
  selectTimeSlot(e) {
    // 如果未登录，提示用户登录
    if (!this.data.isLogin) {
      Message.info({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请先登录后再进行预约'
      });
      return;
    }
    
    const index = e.currentTarget.dataset.index;
    
    // 检查时间段是否可用
    if (!this.data.timeSlots[index].isAvailable) {
      return;
    }
    
    let selectedTimeSlots = [...this.data.selectedTimeSlots];
    let timeSlots = [...this.data.timeSlots];
    
    // 如果已经选中，则取消选中
    if (timeSlots[index].isSelected) {
      // 判断是否是连续时间段的边界
      if (selectedTimeSlots.length > 1) {
        // 只能从两端取消选择，不能从中间取消
        const minIndex = Math.min(...selectedTimeSlots);
        const maxIndex = Math.max(...selectedTimeSlots);
        
        if (index !== minIndex && index !== maxIndex) {
          Message.info({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '请从两端取消选择时间段'
          });
          return;
        }
      }
      
      // 取消选中
      timeSlots[index].isSelected = false;
      selectedTimeSlots = selectedTimeSlots.filter(i => i !== index);
    } else {
      // 选中新时间段
      // 检查是否是连续的
      if (selectedTimeSlots.length > 0) {
        const minIndex = Math.min(...selectedTimeSlots);
        const maxIndex = Math.max(...selectedTimeSlots);
        
        // 只能选择相邻的时间段
        if (index !== minIndex - 1 && index !== maxIndex + 1) {
          Message.info({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '请选择连续的时间段进行预约'
          });
          return;
        }
      }
      
      // 选中
      timeSlots[index].isSelected = true;
      selectedTimeSlots.push(index);
    }
    
    this.setData({
      timeSlots,
      selectedTimeSlots
    });
  },
  
  // 上个月
  prevMonth() {
    let { year, month } = this.data;
    month--;
    
    if (month < 1) {
      month = 12;
      year--;
    }
    
    this.setData({
      year,
      month,
      selectedDate: null,
      selectedDateFormatted: '',
      selectedTimeSlots: []
    });
    
    this.generateCalendar();
  },
  
  // 下个月
  nextMonth() {
    let { year, month } = this.data;
    month++;
    
    if (month > 12) {
      month = 1;
      year++;
    }
    
    this.setData({
      year,
      month,
      selectedDate: null,
      selectedDateFormatted: '',
      selectedTimeSlots: []
    });
    
    this.generateCalendar();
  },
  
  // 电话号码输入
  onPhoneInput(e) {
    this.setData({
      phoneNumber: e.detail.value
    });
  },
  
  // 提交预约
  submitAppointment() {
    // 如果未登录，提示用户登录
    if (!this.data.isLogin) {
      Message.info({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请先登录后再进行预约'
      });
      
      setTimeout(() => {
        this.goToLogin();
      }, 1000);
      
      return;
    }
    
    const { selectedDate, selectedTimeSlots, phoneNumber } = this.data;
    
    // 验证表单
    if (!selectedDate) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请选择预约日期'
      });
      return;
    }
    
    if (selectedTimeSlots.length === 0) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请选择预约时间段'
      });
      return;
    }
    
    if (!phoneNumber || phoneNumber.length !== 11) {
      Message.error({
        context: this,
        offset: [20, 32],
        duration: 2000,
        content: '请输入正确的手机号码'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({ title: '提交中...' });
    
    // 格式化日期为 YYYY-MM-DD 格式
    const { year, month, day } = selectedDate;
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // 获取选中的时间段
    const selectedTimes = selectedTimeSlots.map(index => this.data.timeSlots[index].time);
    
    // 调用云函数创建预约
    wx.cloud.callFunction({
      name: 'createAppointment',
      data: {
        date: formattedDate,
        times: selectedTimes,
        phone: phoneNumber
      },
      success: (res: any) => {
        wx.hideLoading();
        
        const { success, message } = res.result;
        
        if (success) {
          Message.success({
            context: this,
            offset: [20, 32],
            duration: 2000,
            content: '预约成功'
          });
          
          // 重置表单
          this.resetForm();
        } else {
          Message.error({
            context: this,
            offset: [20, 32],
            duration: 3000,
            content: message || '预约失败，请重试'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('预约失败', err);
        
        Message.error({
          context: this,
          offset: [20, 32],
          duration: 3000,
          content: '预约失败，请重试'
        });
      }
    });
  },
  
  // 重置表单
  resetForm() {
    // 重置日期选择
    const calendarDays = this.data.calendarDays.map(item => {
      return { ...item, isSelected: false };
    });
    
    // 重置时间段选择
    const timeSlots = this.data.timeSlots.map(item => {
      return { ...item, isSelected: false };
    });
    
    this.setData({
      calendarDays,
      selectedDate: null,
      selectedDateFormatted: '',
      timeSlots,
      selectedTimeSlots: [],
      phoneNumber: ''
    });
  }
}); 