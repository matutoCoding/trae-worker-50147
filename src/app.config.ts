export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/booking/index',
    'pages/approval/index',
    'pages/mine/index',
    'pages/roomDetail/index',
    'pages/bookingForm/index',
    'pages/bookingDetail/index',
    'pages/approvalDetail/index',
    'pages/checkIn/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1E6FBA',
    navigationBarTitleText: '研讨间预约',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E6FBA',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/booking/index',
        text: '预约'
      },
      {
        pagePath: 'pages/approval/index',
        text: '审批'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
