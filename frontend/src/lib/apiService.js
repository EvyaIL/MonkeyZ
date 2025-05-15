import axios from "axios";


class ApiService {
    constructor() {
        this.endpoint = `${process.env.REACT_APP_PATH_BACKEND}`;
        console.log(process.env.REACT_APP_PATH_BACKEND);

        this.token = null;

        this.httpClient = axios.create({
            baseURL: this.endpoint,
            headers: {
                "Content-Type": "application/json",
            },
        });

        this.httpClient.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    setToken(token) {
        this.token = token;
    }

    async request(method, url, data = null, params = null, contentType = "application/json") {
        try {
            const response = await this.httpClient({
                method,
                url,
                data,
                params,
                headers: { "Content-Type": contentType },
            });
    
            return { data: response.data, error: null };
        } catch (error) {
            return { data: null, error: this.handleError(error) };
        }
    }

    handleError(error) {
        if (error.response) {
            console.error("API Error:", error.response.data);
            return error.response.data?.error || `Error: ${error.response.status}`;
        } else if (error.request) {
            console.error("No Response from Server:", error.request);
            return "No response from the server.";
        } else {
            console.error("Request Setup Error:", error.message);
            return `Error: ${error.message}`;
        }
    }

    get(url, params = null,contentType = "application/json") {
        return this.request("GET", url, null, params, contentType);
    }

    post(url, data, contentType = "application/json") {
        return this.request("POST", url, data, null, contentType);
    }

    put(url, data, contentType = "application/json") {
        return this.request("PUT", url, data, null, contentType);
    }

    delete(url, params = null) {
        return this.request("DELETE", url, null, params);
    }
}

export const apiService = new ApiService();
