import axios from "axios";
import { getCookies } from "../utils/utils";
import { LONG_LIVE_TOKEN } from "../constant/constants";

export const api = axios.create({
    baseURL : import.meta.env.VITE_API_URL,
    headers :{
        'Accept': 'application/json'
    }
})
api.interceptors.request.use(function (config) {
    // Do something before request is sent
    const token = getCookies(LONG_LIVE_TOKEN)
    if (token) {
        config.headers.Authorization = token
    }
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  },
  { synchronous: true, runWhen: () => true}
);