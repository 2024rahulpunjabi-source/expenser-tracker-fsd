import toast from "react-hot-toast";

export const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 100);
  document.cookie = `${name}=${value};expires=${date.toUTCString()}`;
};

export const getCookies = (name) => {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    const [key, value] = cookie.split("=");
    if (key === name) {
      return value;
    }
  }
  return null;
};

export const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`
}

export const errorHandler = (err) => {
    console.log(err);
    
    console.log("hello fromm err");
  if (err.status == 400) {
    toast.error(err.response.data.data);
  }
};
