import axios from 'axios';
import ServerService from './ServerService';
import AxiosWrapper from './axiosWrapper';
import { ENV } from '@/utils/ENV';

export const api = (token = '') => {
  if (token) {
    return axios.create({
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
  }

  return axios.create();
};

// export const IapiPublic = axios.create();

export const IapiAuth = (auth: boolean) => {
  if (!auth) {
    return new ServerService(new AxiosWrapper(api(), ENV.API_ENDPOINT));
  } else {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';

    return new ServerService(
      new AxiosWrapper(api(token || ''), ENV.API_ENDPOINT)
    );
  }
};
