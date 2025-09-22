export default [
  {
    url: '/api/user-stat/daily',
    method: 'get',
    response: () => {
      return require('./user-stat-daily.json');
    },
  },
];
