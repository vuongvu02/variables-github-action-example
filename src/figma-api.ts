import axios from 'axios';
import {
  GetLocalVariablesResponse,
  PostVariablesRequestBody,
  PostVariablesResponse,
} from '@figma/rest-api-spec';

export default class FigmaApi {
  private baseUrl: string;
  private personalAccessToken: string;

  constructor(personalAccessToken: string) {
    this.personalAccessToken = personalAccessToken;
    this.baseUrl = 'https://api.figma.com/v1';
  }

  async getLocalVariables(fileKey: string) {
    const resp = await axios.request<GetLocalVariablesResponse>({
      url: `${this.baseUrl}/files/${fileKey}/variables/local`,
      headers: {
        Accept: '*/*',
        'X-Figma-Token': this.personalAccessToken,
      },
    });

    return resp.data;
  }

  async postVariables(fileKey: string, payload: PostVariablesRequestBody) {
    const resp = await axios.request<PostVariablesResponse>({
      url: `${this.baseUrl}/files/${fileKey}/variables`,
      method: 'POST',
      headers: {
        Accept: '*/*',
        'X-Figma-Token': this.personalAccessToken,
      },
      data: payload,
    });

    return resp.data;
  }
}
