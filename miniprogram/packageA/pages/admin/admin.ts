// 引入消息提示组件
import Message from 'tdesign-miniprogram/message/index';

// 管理员页面
Page({
  data: {
    isAdmin: false,
    loading: true,
    activeTab: 'users',
    adminPassword: '', // 添加密码字段
    
    // 审核对话框
    approveDialogVisible: false,
    currentAppointmentId: '',
    doorPassword: '',
    
    // 修改密码对话框
    passwordDialogVisible: false,
    
    // 用户管理
    users: [],
    userSearchValue: '',
    hasMoreUsers: false,
    userSkip: 0,
    userLimit: 10,
    
    // 预约管理
    appointments: [],
    appointmentSearchValue: '',
    hasMoreAppointments: false,
    appointmentSkip: 0,
    appointmentLimit: 10,
    statusFilter: '',
    statusOptions: [
      { label: '全部状态', value: '' },
      { label: '待审核', value: '待审核' },
      { label: '已确认', value: '已确认' },
      { label: '已取消', value: '已取消' },
      { label: '已完成', value: '已完成' }
    ],
    
    // 轮播图管理
    bannerImages: [],
    bannerImagesChanged: false
  },

  onLoad() {
    this.setData({ loading: false });
  },
  
  // 处理密码输入
  onPasswordInput(e: any) {
    this.setData({
      adminPassword: e.detail.value
    });
  },
  
  // 管理员登录
  async adminLogin() {
    const { adminPassword } = this.data;
    
    if (!adminPassword) {
      Message.error({
        context: this,
        offset: [20, 32],
        content: '请输入管理员密码'
      });
        return;
      }
      
    this.setData({ loading: true });
    
    try {
      // 调用云函数验证密码
      const result = await wx.cloud.callFunction({
        name: 'checkAdminPermission',
        data: { password: adminPassword }
      });
      
      const { isAdmin } = result.result as { isAdmin: boolean };
      
      if (isAdmin) {
        this.setData({ isAdmin, loading: false });
        // 加载初始数据
        this.loadUsers();
        this.loadAppointments();
        this.loadBannerImages();
        
        Message.success({
          context: this,
          offset: [20, 32],
          content: '登录成功'
        });
      } else {
        this.setData({ loading: false });
        Message.error({
          context: this,
          offset: [20, 32],
          content: '密码错误'
        });
      }
    } catch (error) {
      console.error('管理员登录失败', error);
      this.setData({ loading: false });
      Message.error({
        context: this,
        offset: [20, 32],
        content: '登录失败，请重试'
      });
    }
  },
  
  // 切换标签页
  onTabChange(e: any) {
    const { value } = e.detail;
    this.setData({ activeTab: value });
    
    // 如果切换到轮播图管理标签，加载轮播图数据
    if (value === 'banner' && this.data.bannerImages.length === 0) {
      this.loadBannerImages();
    }
  },
  
  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
  
  // 用户搜索输入变化
  onUserSearchChange(e: any) {
    this.setData({
      userSearchValue: e.detail.value
    });
  },
  
  // 预约搜索输入变化
  onAppointmentSearchChange(e: any) {
    this.setData({
      appointmentSearchValue: e.detail.value
    });
  },
  
  // 加载用户列表
  async loadUsers() {
    try {
      this.setData({ loading: true });
      
      const { userSkip, userLimit, userSearchValue } = this.data;
      
      const result = await wx.cloud.callFunction({
        name: 'getUsers',
        data: {
          skip: userSkip,
          limit: userLimit,
          searchValue: userSearchValue
        }
      });
      
      const { users, total } = result.result as { users: any[], total: number };
      
      this.setData({
        users: userSkip > 0 ? [...this.data.users, ...users] : users,
        hasMoreUsers: this.data.users.length + users.length < total,
        loading: false
      });
    } catch (error) {
      console.error('加载用户列表失败', error);
      this.setData({ loading: false });
      Message.error({
        context: this,
        offset: [20, 32],
        content: '加载用户列表失败'
      });
    }
  },
  
  // 加载更多用户
  loadMoreUsers() {
    this.setData({ userSkip: this.data.users.length }, () => {
      this.loadUsers();
    });
  },
  
  // 用户搜索
  onUserSearch() {
    this.setData({ userSkip: 0 }, () => {
      this.loadUsers();
    });
  },
  
  // 查看用户详情
  viewUserDetail(e: any) {
    const user = e.currentTarget.dataset.user;
    // 将性别数字转换为文字
    let genderText = '未知';
    if (user.gender === 1) {
      genderText = '男';
    } else if (user.gender === 2) {
      genderText = '女';
    }
    
    wx.showModal({
      title: '用户详情',
      content: `昵称: ${user.nickname || '未设置'}\nOpenID: ${user.openid}\n性别: ${genderText}\n创建时间: ${new Date(user.createTime).toLocaleString()}`,
      showCancel: false
    });
  },
  
  // 加载预约列表
  async loadAppointments() {
    try {
      this.setData({ loading: true });
      
      const { appointmentSkip, appointmentLimit, appointmentSearchValue, statusFilter } = this.data;
      
      const result = await wx.cloud.callFunction({
        name: 'getAllAppointments',
        data: {
          skip: appointmentSkip,
          limit: appointmentLimit,
          searchValue: appointmentSearchValue,
          statusFilter
        }
      });
      
      const { appointments, total } = result.result as { appointments: any[], total: number };
      
      // 处理数据，添加格式化字段和状态样式
      const processedAppointments = appointments.map(item => {
        // 格式化时间
        let timeFormatted = '';
        if (item.times && item.times.length > 0) {
          timeFormatted = item.times.join(', ');
        }
        
        // 添加状态样式类
        let statusClass = '';
        switch (item.status) {
          case '待审核':
            statusClass = 'pending';
            break;
          case '已确认':
            statusClass = 'approved';
            break;
          case '已取消':
            statusClass = 'canceled';
            break;
          default:
            statusClass = '';
        }
        
        return {
          ...item,
          timeFormatted,
          statusClass
        };
      });
      
      this.setData({
        appointments: appointmentSkip > 0 ? [...this.data.appointments, ...processedAppointments] : processedAppointments,
        hasMoreAppointments: this.data.appointments.length + appointments.length < total,
        loading: false
      });
    } catch (error) {
      console.error('加载预约列表失败', error);
      this.setData({ loading: false });
      Message.error({
        context: this,
        offset: [20, 32],
        content: '加载预约列表失败'
      });
    }
  },
  
  // 加载更多预约
  loadMoreAppointments() {
    this.setData({ appointmentSkip: this.data.appointments.length }, () => {
      this.loadAppointments();
    });
  },
  
  // 预约搜索
  onAppointmentSearch() {
    this.setData({ appointmentSkip: 0 }, () => {
      this.loadAppointments();
    });
  },
  
  // 状态筛选变化
  onStatusFilterChange(e: any) {
    const { value } = e.detail;
    this.setData({ statusFilter: value, appointmentSkip: 0 }, () => {
      this.loadAppointments();
    });
  },
  
  // 显示审核对话框
  showApproveDialog(e: any) {
    const { id } = e.currentTarget.dataset;
    this.setData({
      approveDialogVisible: true,
      currentAppointmentId: id,
      doorPassword: ''
    });
  },
  
  // 关闭审核对话框
  closeApproveDialog() {
    this.setData({
      approveDialogVisible: false,
      doorPassword: ''
    });
  },
  
  // 显示修改密码对话框
  showPasswordDialog(e: any) {
    const { id, password } = e.currentTarget.dataset;
    this.setData({
      passwordDialogVisible: true,
      currentAppointmentId: id,
      doorPassword: ''  // 清空输入框，不显示原密码
    });
  },
  
  // 关闭修改密码对话框
  closePasswordDialog() {
    this.setData({
      passwordDialogVisible: false,
      doorPassword: ''
    });
  },
  
  // 确认修改密码
  async confirmUpdatePassword() {
    const { currentAppointmentId, doorPassword } = this.data;
    
    if (!currentAppointmentId) {
      return;
    }
    
    try {
      wx.showLoading({ title: '处理中...' });
      
      // 生成随机密码（如果没有输入）
      const password = doorPassword || this.generateRandomPassword();
      
      // 调用云函数更新密码
      const result = await wx.cloud.callFunction({
        name: 'updateDoorPassword',
        data: { 
          id: currentAppointmentId,
          doorPassword: password
        }
      });
      
      wx.hideLoading();
      
      // 关闭对话框
      this.setData({
        passwordDialogVisible: false,
        doorPassword: ''
      });
      
      // 显示成功信息
      wx.showModal({
        title: '修改成功',
        content: `新的开门密码：${password}\n\n请记住此密码或告知用户`,
        showCancel: false
      });
      
      // 重新加载预约列表
      this.setData({ appointmentSkip: 0 }, () => {
        this.loadAppointments();
      });
    } catch (error) {
      wx.hideLoading();
      console.error('修改密码失败', error);
      Message.error({
        context: this,
        offset: [20, 32],
        content: '操作失败'
      });
    }
  },
  
  // 生成随机密码
  generateRandomPassword() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  
  // 处理开门密码输入
  onDoorPasswordInput(e: any) {
    this.setData({
      doorPassword: e.detail.value
    });
  },
  
  // 确认审核通过
  async confirmApprove() {
    const { currentAppointmentId, doorPassword } = this.data;
    
    if (!currentAppointmentId) {
      return;
    }
    
    try {
      wx.showLoading({ title: '处理中...' });
      
      // 生成随机密码（如果没有输入）
      const password = doorPassword || this.generateRandomPassword();
      
      const result = await wx.cloud.callFunction({
        name: 'approveAppointment',
        data: { 
          id: currentAppointmentId,
          doorPassword: password
        }
      });
      
      wx.hideLoading();
      
      // 关闭对话框
      this.setData({
        approveDialogVisible: false,
        doorPassword: ''
      });
      
      // 显示密码信息
      if (result.result && result.result.doorPassword) {
        wx.showModal({
          title: '审核成功',
          content: `开门密码：${result.result.doorPassword}\n\n请记住此密码或告知用户`,
          showCancel: false
        });
      } else {
        Message.success({
          context: this,
          offset: [20, 32],
          content: '已通过审核'
        });
      }
      
      // 重新加载预约列表
      this.setData({ appointmentSkip: 0 }, () => {
        this.loadAppointments();
      });
    } catch (error) {
      wx.hideLoading();
      console.error('审核预约失败', error);
      Message.error({
        context: this,
        offset: [20, 32],
        content: '操作失败'
      });
    }
  },
  
  // 审核通过预约
  async approveAppointment(e: any) {
    const { id } = e.currentTarget.dataset;
    
    this.setData({
      approveDialogVisible: true,
      currentAppointmentId: id,
      doorPassword: ''
    });
  },
  
  // 取消预约
  async cancelAppointment(e: any) {
    const { id } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认操作',
      content: '确定要取消此预约吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'adminCancelAppointment',
              data: { id }
            });
            
            // 重新加载预约列表
            this.setData({ appointmentSkip: 0 }, () => {
              this.loadAppointments();
            });
            
            Message.success({
              context: this,
              offset: [20, 32],
              content: '已取消预约'
            });
          } catch (error) {
            console.error('取消预约失败', error);
            Message.error({
              context: this,
              offset: [20, 32],
              content: '操作失败'
            });
          }
        }
      }
    });
  },
  
  // ===== 轮播图管理功能 =====
  
  // 加载轮播图数据
  async loadBannerImages() {
    try {
      this.setData({ loading: true });
      
      const db = wx.cloud.database();
      // 尝试从数据库获取轮播图配置
      const configRes = await db.collection('siteConfig').doc('bannerImages').get();
      
      if (configRes && configRes.data && configRes.data.images) {
        this.setData({
          bannerImages: configRes.data.images,
          bannerImagesChanged: false,
          loading: false
        });
      } else {
        // 如果没有配置，则使用默认图片
        this.setData({
          bannerImages: [
            { url: '/assets/images/banner1.jpg' },
            { url: '/assets/images/banner2.jpg' },
            { url: '/assets/images/banner3.jpg' },
          ],
          bannerImagesChanged: true,
          loading: false
        });
      }
    } catch (error) {
      console.error('加载轮播图失败', error);
      // 使用默认图片
      this.setData({
        bannerImages: [
          { url: '/assets/images/banner1.jpg' },
          { url: '/assets/images/banner2.jpg' },
          { url: '/assets/images/banner3.jpg' },
        ],
        bannerImagesChanged: true,
        loading: false
      });
    }
  },
  
  // 选择轮播图图片
  chooseBannerImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.uploadBannerImage(res.tempFilePaths[0]);
      }
    });
  },
  
  // 上传轮播图图片到云存储
  async uploadBannerImage(filePath) {
    try {
      this.setData({ loading: true });
      
      // 生成随机文件名
      const timestamp = new Date().getTime();
      const randomNum = Math.floor(Math.random() * 1000);
      const extension = filePath.match(/\.[^.]+$/)[0] || '';
      const cloudPath = `banners/banner_${timestamp}_${randomNum}${extension}`;
      
      // 上传到云存储
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath,
      });
      
      if (uploadRes.fileID) {
        // 获取图片访问URL
        const fileList = [{ fileID: uploadRes.fileID, max_age: 31536000 }];
        const getTempRes = await wx.cloud.getTempFileURL({ fileList });
        
        if (getTempRes.fileList && getTempRes.fileList[0].tempFileURL) {
          const newBannerImages = [...this.data.bannerImages, { 
            url: getTempRes.fileList[0].tempFileURL,
            fileID: uploadRes.fileID
          }];
          
          this.setData({
            bannerImages: newBannerImages,
            bannerImagesChanged: true,
            loading: false
          });
          
          Message.success({
            context: this,
            offset: [20, 32],
            content: '图片上传成功'
          });
        } else {
          throw new Error('获取图片URL失败');
        }
      } else {
        throw new Error('上传图片失败');
      }
    } catch (error) {
      console.error('上传轮播图失败', error);
      this.setData({ loading: false });
      Message.error({
        context: this,
        offset: [20, 32],
        content: '上传图片失败'
      });
    }
  },
  
  // 删除轮播图
  async deleteBanner(e) {
    const { index } = e.currentTarget.dataset;
    const banner = this.data.bannerImages[index];
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张轮播图吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            this.setData({ loading: true });
            
            // 如果有fileID，从云存储中删除
            if (banner.fileID) {
              try {
                await wx.cloud.deleteFile({
                  fileList: [banner.fileID]
                });
              } catch (error) {
                console.error('删除云存储文件失败', error);
                // 继续删除本地记录
              }
            }
            
            // 更新数据
            const newBannerImages = [...this.data.bannerImages];
            newBannerImages.splice(index, 1);
            
            this.setData({
              bannerImages: newBannerImages,
              bannerImagesChanged: true,
              loading: false
            });
            
            Message.success({
              context: this,
              offset: [20, 32],
              content: '删除成功'
            });
          } catch (error) {
            console.error('删除轮播图失败', error);
            this.setData({ loading: false });
            Message.error({
              context: this,
              offset: [20, 32],
              content: '删除失败'
            });
          }
        }
      }
    });
  },
  
  // 上移轮播图
  moveBannerUp(e) {
    const { index } = e.currentTarget.dataset;
    if (index > 0) {
      const newBannerImages = [...this.data.bannerImages];
      const temp = newBannerImages[index];
      newBannerImages[index] = newBannerImages[index - 1];
      newBannerImages[index - 1] = temp;
      
      this.setData({
        bannerImages: newBannerImages,
        bannerImagesChanged: true
      });
    }
  },
  
  // 下移轮播图
  moveBannerDown(e) {
    const { index } = e.currentTarget.dataset;
    if (index < this.data.bannerImages.length - 1) {
      const newBannerImages = [...this.data.bannerImages];
      const temp = newBannerImages[index];
      newBannerImages[index] = newBannerImages[index + 1];
      newBannerImages[index + 1] = temp;
      
      this.setData({
        bannerImages: newBannerImages,
        bannerImagesChanged: true
      });
    }
  },
  
  // 预览图片
  previewImage(e) {
    const { url } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: this.data.bannerImages.map(item => item.url)
    });
  },
  
  // 保存轮播图设置
  async saveBannerImages() {
    try {
      this.setData({ loading: true });
      
      // 调用云函数保存轮播图配置
      try {
        const result = await wx.cloud.callFunction({
          name: 'updateBannerImages',
          data: { 
            images: this.data.bannerImages
          }
        });
        
        if (result.result && result.result.success) {
          this.setData({
            bannerImagesChanged: false,
            loading: false
          });
          
          Message.success({
            context: this,
            offset: [20, 32],
            content: '轮播图设置已保存'
          });
        } else {
          throw new Error('保存失败');
        }
      } catch (callFunctionError) {
        console.error('调用云函数失败', callFunctionError);
        
        // 尝试直接通过数据库API保存
        const db = wx.cloud.database();
        
        // 检查是否存在siteConfig集合
        try {
          await db.createCollection('siteConfig');
        } catch (error) {
          // 集合可能已存在，忽略错误
        }
        
        // 保存轮播图配置
        try {
          await db.collection('siteConfig').doc('bannerImages').update({
            data: {
              images: this.data.bannerImages,
              updateTime: db.serverDate()
            }
          });
        } catch (updateError) {
          // 如果文档不存在，则添加新文档
          await db.collection('siteConfig').add({
            data: {
              _id: 'bannerImages',
              images: this.data.bannerImages,
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          });
        }
        
        this.setData({
          bannerImagesChanged: false,
          loading: false
        });
        
        Message.success({
          context: this,
          offset: [20, 32],
          content: '轮播图设置已保存'
        });
      }
    } catch (error) {
      console.error('保存轮播图设置失败', error);
      this.setData({ loading: false });
      Message.error({
        context: this,
        offset: [20, 32],
        content: '保存失败，请重试'
      });
    }
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
  }
}); 