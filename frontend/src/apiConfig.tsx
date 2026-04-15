const BASE_URL = 'https://api.air-aware.de/api';    

export const Endpoints = {
  LatestSensorData: `${BASE_URL}/SensorData/latest`,
  Thresholds: `${BASE_URL}/SensorData/thresholds`,
  Alerts: `${BASE_URL}/SensorData/alerts`,
  Login: `${BASE_URL}/Auth/login`,
};

