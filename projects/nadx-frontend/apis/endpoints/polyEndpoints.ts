import { IPolyEvent, IPolyEventResponse, IPolyTagResponseItem } from '@/types/poly.types';
import Endpoint from './Endpoint';

export default class PolyEndpoints extends Endpoint {
  async getEvents({
    limit = 10,
    offset = 0,
    tag = undefined,
  }: {
    limit?: number;
    offset?: number;
    tag?: string;
  }) {
    return await this.axiosWrapper
      .get(`/poly/events`, {
        params: {
          limit,
          offset,
          tag,
        },
      })
      .then((res) => this.axiosWrapper.interceptor<IPolyEventResponse>(res))
      .catch((err) => this.axiosWrapper.interceptor<IPolyEventResponse>(err));
  }

  async getTags() {
    return await this.axiosWrapper
      .get(`/poly/tags`, {})
      .then((res) => this.axiosWrapper.interceptor<IPolyTagResponseItem[]>(res))
      .catch((err) =>
        this.axiosWrapper.interceptor<IPolyTagResponseItem[]>(err)
      );
  }

  async getBySlug(slug: string) {
    return await this.axiosWrapper
      .get(`/poly/event/${slug}`, {})
      .then((res) => this.axiosWrapper.interceptor<IPolyEvent>(res))
      .catch((err) =>
        this.axiosWrapper.interceptor<IPolyEvent>(err)
      );
  }
}
