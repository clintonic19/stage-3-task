const axios = require("axios");
const { getToken } = require("./store.config");
const dotenv = require("dotenv").config();

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

module.exports = api;