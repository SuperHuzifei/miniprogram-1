// pages/profile/profile.js
// ... existing code ...

  // 跳转到预约详情
  goReservation(e) {
    const { id, amount, hours } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/pages/reservation/reservation?appointmentId=${id}&amount=${amount}&hours=${hours || 1}`
    });
  },

// ... existing code ... 