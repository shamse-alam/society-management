import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Don't redirect on auth endpoints — let the login page handle its own errors
      if (!url.includes('/auth/')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const publicAPI = {
  getSocietyConfig: () => api.get('/public/society-config'),
  getIncomeTypes: () => api.get('/public/income-types'),
  getExpenseTypes: () => api.get('/public/expense-types'),
};

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  uploadProfileImage: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/users/${id}/profile-image`, formData);
  },

  getProperties: () => api.get('/admin/properties'),
  getProperty: (id) => api.get(`/admin/properties/${id}`),
  createProperty: (data) => api.post('/admin/properties', data),
  updateProperty: (id, data) => api.put(`/admin/properties/${id}`, data),
  deleteProperty: (id) => api.delete(`/admin/properties/${id}`),

  getAllPayments: () => api.get('/admin/payments'),
  updatePayment: (id, data) => api.put(`/admin/payments/${id}`, data),
  getPaymentsByType: (type) => api.get(`/admin/payments/type/${type}`),
  getPaymentsByUser: (userId) => api.get(`/admin/payments/user/${userId}`),
  recordReceipt: (invoiceId, amount) => api.post(`/admin/payments/${invoiceId}/record-receipt`, { amount }),
  getPayment: (id) => api.get(`/admin/payments/${id}`),
  deletePayment: (id) => api.delete(`/admin/payments/${id}`),
  recordPayment: (data) => api.post('/admin/payments', data),

  getAllBookings: () => api.get('/admin/bookings'),
  getAmenities: () => api.get('/admin/amenities'),
  createAmenity: (data) => api.post('/admin/amenities', data),
  updateAmenity: (id, data) => api.put(`/admin/amenities/${id}`, data),
  deleteAmenity: (id) => api.delete(`/admin/amenities/${id}`),
  createBooking: (data) => api.post('/admin/bookings', data),
  confirmBooking: (id) => api.put(`/admin/bookings/${id}/confirm`),
  cancelBooking: (id) => api.put(`/admin/bookings/${id}/cancel`),

  getNotices: () => api.get('/admin/notices'),
  createNotice: (data) => api.post('/admin/notices', data),
  updateNotice: (id, data) => api.put(`/admin/notices/${id}`, data),
  deleteNotice: (id) => api.delete(`/admin/notices/${id}`),

  getPolls: () => api.get('/admin/polls'),
  createPoll: (data) => api.post('/admin/polls', data),
  togglePoll: (id) => api.put(`/admin/polls/${id}/toggle`),
  deletePoll: (id) => api.delete(`/admin/polls/${id}`),

  getComplaints: () => api.get('/admin/complaints'),
  updateComplaint: (id, data) => api.put(`/admin/complaints/${id}`, data),
  getComplaintStats: () => api.get('/admin/complaints/stats'),

  getVisitorLogs: () => api.get('/admin/visitors'),
  getVisitorStats: () => api.get('/admin/visitors/stats'),
  getVisitorAnalytics: (from, to) => api.get('/admin/visitors/analytics', { params: { from, to } }),
  getAllDailyHelp: () => api.get('/admin/daily-help'),
  addSocietyStaff: (data) => api.post('/admin/daily-help/society-staff', data),
  uploadDailyHelpPhotoAdmin: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/daily-help/${id}/photo`, formData);
  },

  getExpenses: () => api.get('/admin/expenses'),
  getExpensesByStatus: (status) => api.get(`/admin/expenses/status/${status}`),
  updateExpense: (id, data) => api.put(`/admin/expenses/${id}`, data),
  createExpense: (data) => api.post('/admin/expenses', data),
  deleteExpense: (id) => api.delete(`/admin/expenses/${id}`),
  approveExpense: (id) => api.put(`/admin/expenses/${id}/approve`),
  markExpensePaid: (id, data) => api.put(`/admin/expenses/${id}/pay`, data),
  cancelExpense: (id) => api.put(`/admin/expenses/${id}/cancel`),
  uploadBill: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/expenses/${id}/bill`, formData);
  },
  generateMonthlyVouchers: (year, month) => api.post(`/admin/expenses/generate-monthly?year=${year}&month=${month}`),
  getExpensesByVendor: (vendorId) => api.get(`/admin/expenses/vendor/${vendorId}`),
  getVendorsByType: (type) => api.get(`/admin/vendors/type/${type}`),
  getBalanceSheet: (from, to) => api.get('/admin/balance-sheet', { params: { from, to } }),

  // Fund Releases
  getFundReleases: () => api.get('/admin/fund-releases'),
  getFundReleasesByStatus: (status) => api.get(`/admin/fund-releases/status/${status}`),
  createFundRelease: (data) => api.post('/admin/fund-releases', data),
  approveFundRelease: (id) => api.put(`/admin/fund-releases/${id}/approve`),
  rejectFundRelease: (id, data) => api.put(`/admin/fund-releases/${id}/reject`, data),
  markFundReleased: (id) => api.put(`/admin/fund-releases/${id}/release`),

  // Payment Refunds
  getRefunds: () => api.get('/admin/refunds'),
  getRefundsByStatus: (status) => api.get(`/admin/refunds/status/${status}`),
  createRefund: (data) => api.post('/admin/refunds', data),
  approveRefund: (id) => api.put(`/admin/refunds/${id}/approve`),
  rejectRefund: (id, data) => api.put(`/admin/refunds/${id}/reject`, data),
  processRefund: (id) => api.put(`/admin/refunds/${id}/process`),

  generateInvoices: (data) => api.post('/admin/invoices/generate', data),
  applyPenalties: (data) => api.post('/admin/invoices/apply-penalties', data),
  getDefaulters: () => api.get('/admin/reports/defaulters'),

  getEmergencyContacts: () => api.get('/admin/emergency-contacts'),
  createEmergencyContact: (data) => api.post('/admin/emergency-contacts', data),
  updateEmergencyContact: (id, data) => api.put(`/admin/emergency-contacts/${id}`, data),
  deleteEmergencyContact: (id) => api.delete(`/admin/emergency-contacts/${id}`),

  getFamilyMembers: (unitNumber) => api.get('/admin/family-members', { params: unitNumber ? { unitNumber } : {} }),
  addFamilyMember: (data) => api.post('/admin/family-members', data),
  updateFamilyMember: (id, data) => api.put(`/admin/family-members/${id}`, data),
  deleteFamilyMember: (id) => api.delete(`/admin/family-members/${id}`),
  uploadFamilyMemberPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/family-members/${id}/photo`, formData);
  },

  getVehicles: (unitNumber) => api.get('/admin/vehicles', { params: unitNumber ? { unitNumber } : {} }),
  addVehicle: (data) => api.post('/admin/vehicles', data),
  updateVehicle: (id, data) => api.put(`/admin/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/admin/vehicles/${id}`),

  getParkingSlots: () => api.get('/admin/parking-slots'),
  getAvailableSlots: () => api.get('/admin/parking-slots/available'),
  createParkingSlot: (data) => api.post('/admin/parking-slots', data),
  updateParkingSlot: (id, data) => api.put(`/admin/parking-slots/${id}`, data),
  deleteParkingSlot: (id) => api.delete(`/admin/parking-slots/${id}`),

  getVisitorParking: () => api.get('/admin/visitor-parking'),

  getDocuments: (category) => api.get('/admin/documents', { params: category ? { category } : {} }),
  uploadDocument: (formData) => api.post('/admin/documents', formData),
  updateDocument: (id, formData) => api.put(`/admin/documents/${id}`, formData),
  deleteDocument: (id) => api.delete(`/admin/documents/${id}`),

  pinForumTopic: (id) => api.put(`/admin/forum/topics/${id}/pin`),
  lockForumTopic: (id) => api.put(`/admin/forum/topics/${id}/lock`),
  deleteForumTopic: (id) => api.delete(`/admin/forum/topics/${id}`),
  deleteForumPost: (id) => api.delete(`/admin/forum/posts/${id}`),

  getEvents: () => api.get('/admin/events'),
  createEvent: (data) => api.post('/admin/events', data),
  updateEvent: (id, data) => api.put(`/admin/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),

  getMoveRequests: (status) => api.get('/admin/move-requests', { params: status ? { status } : {} }),
  approveMoveRequest: (id, data) => api.put(`/admin/move-requests/${id}/approve`, data),
  rejectMoveRequest: (id, data) => api.put(`/admin/move-requests/${id}/reject`, data),
  completeMoveRequest: (id) => api.put(`/admin/move-requests/${id}/complete`),

  getVendors: () => api.get('/admin/vendors'),
  getVendor: (id) => api.get(`/admin/vendors/${id}`),
  getActiveVendors: () => api.get('/admin/vendors/active'),
  createVendor: (data) => api.post('/admin/vendors', data),
  updateVendor: (id, data) => api.put(`/admin/vendors/${id}`, data),
  deleteVendor: (id) => api.delete(`/admin/vendors/${id}`),
  uploadVendorLogo: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/admin/vendors/${id}/logo`, formData);
  },

  getSocietyConfig: () => api.get('/admin/society-config'),
  updateSocietyConfig: (data) => api.put('/admin/society-config', data),
  uploadSocietyLogo: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/society-config/logo', formData);
  },

  // Income Types
  getIncomeTypes: () => api.get('/admin/income-types'),
  createIncomeType: (data) => api.post('/admin/income-types', data),
  updateIncomeType: (id, data) => api.put(`/admin/income-types/${id}`, data),
  deleteIncomeType: (id) => api.delete(`/admin/income-types/${id}`),

  // Expense Types
  getExpenseTypes: () => api.get('/admin/expense-types'),
  createExpenseType: (data) => api.post('/admin/expense-types', data),
  updateExpenseType: (id, data) => api.put(`/admin/expense-types/${id}`, data),
  deleteExpenseType: (id) => api.delete(`/admin/expense-types/${id}`),

  // Data Cleanup
  cleanupAllData: () => api.delete('/admin/cleanup'),
};

export const guardAPI = {
  verifyPasscode: (code) => api.get(`/guard/verify/${code}`),
  requestApproval: (data) => api.post('/guard/request-approval', data),
  getAwaitingApproval: () => api.get('/guard/awaiting-approval'),
  checkIn: (data) => api.post('/guard/check-in', data),
  checkOut: (data) => api.post('/guard/check-out', data),
  denyEntry: (id, guardNotes) => api.post(`/guard/deny-entry/${id}`, { guardNotes }),
  getExpected: () => api.get('/guard/expected'),
  getInside: () => api.get('/guard/inside'),
  getStats: () => api.get('/guard/stats'),
  getDailyHelp: () => api.get('/guard/daily-help'),
  addDailyHelpForProperty: (data) => api.post('/guard/daily-help', data),
  checkInDailyHelp: (id) => api.post(`/guard/daily-help/${id}/check-in`),
  uploadDailyHelpPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/guard/daily-help/${id}/photo`, formData);
  },
  logDelivery: (data) => api.post('/guard/deliveries', data),
  getPendingDeliveries: () => api.get('/guard/deliveries/pending'),
  markPickedUp: (id, receivedBy) => api.put(`/guard/deliveries/${id}/picked-up`, { receivedBy }),
  getProperties: () => api.get('/guard/properties'),
  getActiveVisitorParking: () => api.get('/guard/visitor-parking'),
  getAvailableVisitorSlots: () => api.get('/guard/visitor-parking/slots'),
  checkInVisitorParking: (data) => api.post('/guard/visitor-parking/check-in', data),
  checkOutVisitorParking: (id) => api.put(`/guard/visitor-parking/${id}/check-out`),
  verifyVehicle: (vehicleNumber) => api.get(`/guard/vehicles/verify/${vehicleNumber}`),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/change-password', data),
  uploadProfileImage: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user/profile-image', formData);
  },
  getProperties: () => api.get('/user/properties'),

  getMyPayments: () => api.get('/user/payments'),
  getMyPaymentsByType: (type) => api.get(`/user/payments/type/${type}`),

  getNotices: () => api.get('/user/notices'),
  getMyComplaints: () => api.get('/user/complaints'),
  createComplaint: (data) => api.post('/user/complaints', data),
  uploadComplaintAttachment: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/user/complaints/${id}/attachment`, formData);
  },

  getPolls: () => api.get('/user/polls'),
  votePoll: (id, data) => api.post(`/user/polls/${id}/vote`, data),

  preApproveVisitor: (data) => api.post('/user/visitors/pre-approve', data),
  getMyApprovals: () => api.get('/user/visitors/my-approvals'),
  getVisitHistory: () => api.get('/user/visitors/history'),
  cancelApproval: (id) => api.delete(`/user/visitors/${id}`),
  getPendingApprovals: () => api.get('/user/visitors/pending-approvals'),
  approveVisit: (id) => api.put(`/user/visitors/${id}/approve`),
  rejectVisit: (id) => api.put(`/user/visitors/${id}/reject`),
  addDailyHelp: (data) => api.post('/user/daily-help', data),
  getMyDailyHelp: () => api.get('/user/daily-help'),
  deactivateDailyHelp: (id) => api.put(`/user/daily-help/${id}/deactivate`),
  approveDailyHelp: (id) => api.put(`/user/daily-help/${id}/approve`),
  rejectDailyHelp: (id) => api.put(`/user/daily-help/${id}/reject`),
  uploadDailyHelpPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/user/daily-help/${id}/photo`, formData);
  },
  getMyDeliveries: () => api.get('/user/deliveries'),
  getFamilyMembers: () => api.get('/user/family-members'),
  addFamilyMember: (data) => api.post('/user/family-members', data),
  updateFamilyMember: (id, data) => api.put(`/user/family-members/${id}`, data),
  deleteFamilyMember: (id) => api.delete(`/user/family-members/${id}`),
  uploadFamilyMemberPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/user/family-members/${id}/photo`, formData);
  },

  getMyVehicles: () => api.get('/user/vehicles'),
  addVehicle: (data) => api.post('/user/vehicles', data),
  updateVehicle: (id, data) => api.put(`/user/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/user/vehicles/${id}`),
  getMyParkingSlots: () => api.get('/user/parking-slots'),

  getDocuments: (category) => api.get('/user/documents', { params: category ? { category } : {} }),

  getForumTopics: (category) => api.get('/user/forum/topics', { params: category ? { category } : {} }),
  createForumTopic: (data) => api.post('/user/forum/topics', data),
  getTopicPosts: (id) => api.get(`/user/forum/topics/${id}/posts`),
  replyToTopic: (id, data) => api.post(`/user/forum/topics/${id}/reply`, data),
  deleteForumPost: (id) => api.delete(`/user/forum/posts/${id}`),

  getEvents: () => api.get('/user/events'),
  rsvpEvent: (id, data) => api.post(`/user/events/${id}/rsvp`, data),
  cancelRsvp: (id) => api.delete(`/user/events/${id}/rsvp`),

  getMoveRequests: () => api.get('/user/move-requests'),
  createMoveRequest: (data) => api.post('/user/move-requests', data),

  getEmergencyContacts: () => api.get('/user/emergency-contacts'),
  triggerSOS: () => api.post('/user/sos'),

  getAmenities: () => api.get('/user/amenities'),
  createBooking: (data) => api.post('/user/bookings', data),
  getMyBookings: () => api.get('/user/bookings'),
  cancelBooking: (id) => api.put(`/user/bookings/${id}/cancel`),

  getMyRefunds: () => api.get('/user/refunds'),
  requestRefund: (data) => api.post('/user/refunds', data),
};

export const notificationAPI = {
  getNotifications: (page) => api.get('/notifications', { params: { page } }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
