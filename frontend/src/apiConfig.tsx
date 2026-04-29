const BASE_URL = 'https://api.air-aware.de/api';    

export const Endpoints = {
  LatestSensorData: `${BASE_URL}/SensorData/latest`,
  Thresholds: `${BASE_URL}/SensorData/thresholds`,
  Alerts: `${BASE_URL}/SensorData/alerts`,
  Login: `${BASE_URL}/Auth/login`,
  Register: `${BASE_URL}/Auth/register`, 
  DeleteUser: (username: string) => `${BASE_URL}/Auth/user/${username}`,
  History: `${BASE_URL}/SensorData/history`,
  ReportCsv: `${BASE_URL}/SensorData/report/csv`,
};