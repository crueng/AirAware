const BASE_URL = 'http://localhost:5000/api';

export const Endpoints = {
  LatestSensorData: `${BASE_URL}/SensorData/latest`,
  Thresholds: `${BASE_URL}/SensorData/thresholds`,
  Alerts: `${BASE_URL}/SensorData/alerts`,
};