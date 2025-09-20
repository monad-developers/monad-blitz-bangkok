import { IapiAuth } from '@/apis/index';

const usePublicApi = () => {
  // const token = useToken();
  // return apiServer(token);

  return IapiAuth(false);
};

export { usePublicApi };
