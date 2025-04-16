import axios from 'axios'
import { baseURL } from '@/store/constant'

const apiClient = axios.create({
    baseURL: `${baseURL}/api/v1`,
    headers: {
        'Content-type': 'application/json'
    }
})

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Instead of using useNavigate, we'll dispatch a custom event
            const redirectUrl = error.response.data.redirectUrl || '/signin';
            window.dispatchEvent(new CustomEvent('ApiClient Eroor: unauthorized', { detail: { redirectUrl } }));
        }
        return Promise.reject(error);
    }
);

export default apiClient
