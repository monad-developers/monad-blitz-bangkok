import AxiosWrapper from '../axiosWrapper';

export default class Endpoint {
  protected readonly axiosWrapper: AxiosWrapper;
  constructor(axiosWrapper: AxiosWrapper) {
    this.axiosWrapper = axiosWrapper;
  }
}
