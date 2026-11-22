import axios from "axios";
import { redirectUnauthorizedUser } from "../utils/auth";

export const api = axios.create({
    baseURL: "/api"
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        return config
    },
    (error) => Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        const isLoginRequest = axios.isAxiosError(error)
            && error.config?.url?.replace(/\/+$/, "").endsWith("/users/login");
        const path = window.location.pathname.replace(/\/+$/, "") || "/";

        if (
            axios.isAxiosError(error)
            && error.response?.status === 401
            && !isLoginRequest
            && path !== "/"
            && path !== "/cadastro"
        ) {
            redirectUnauthorizedUser();
        }

        return Promise.reject(error);
    }
);