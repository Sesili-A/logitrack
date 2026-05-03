import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.DEV 
    ? "http://localhost:5000/api" 
    : "https://logitrack-fnwo.onrender.com/api",
});

export default API;
