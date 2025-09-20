import PolyEndpoints from '@/apis/endpoints/polyEndpoints';
import AxiosWrapper from './axiosWrapper';

export default class ServerService {
  readonly poly: PolyEndpoints;

  constructor(axiosWrapper: AxiosWrapper) {
    this.poly = new PolyEndpoints(axiosWrapper);
  }
}
