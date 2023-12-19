import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { VerificationDto } from '../dtos/verification.dto';
import { VerificationResponse } from '../dtos/verification.response';

@Injectable()
export class VerificationService {
  constructor() {}

  /**
   * 
   * @param data 
   * @returns The users name & information about the users number.
   * @description Sends a users number in this request then returns the users name
   *  and their monbile account details.
   */
  async verifyUserByNumber(
    data: VerificationDto,
  ): Promise<any> {
    try {
      const response: any = await axios({
        method: 'POST',
        headers: {
          'Authorization': process.env.ORCHID_SECRET,
          'Content-Type': 'application/json',
        },
        url: `${process.env.ORCHID_BASE_URL}/sendRequest`,
        data: data
      });
      return response.data as VerificationResponse;
    } catch (err) {
      return err.response.data as VerificationResponse;
    }
  }
}
