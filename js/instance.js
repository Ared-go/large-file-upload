let instance = axios.create();
// 提取axios的公共信息
instance.defaults.baseURL = "http://127.0.0.1";
instance.defaults.headers["content-type"] = "multipart/form-data";

// axios拦截器
instance.interceptors.response.use(
  function (res) {
    return res.data;
  },
  function error(err) {
    return Promise.reject(err);
  }
);
