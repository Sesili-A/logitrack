import axios from "axios";

const API = axios.create({
  baseURL: "https://logitrack-fnwo.onrender.com/api",
});

export default API;
