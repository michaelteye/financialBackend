// import { HttpException } from '@nestjs/common';

import { HttpException } from '@nestjs/common/exceptions';
import { Connection } from 'mongoose';
import { Console, Command } from 'nestjs-console';
// import { GlobalConfig } from 'rxjs';
// import { globalConfig } from 'src/config/config';
import { HttpRequestService } from '../../shared/services/http.request.service';
import { EntityManager } from 'typeorm';

import { MigrationService } from '../services/migration.service';
import { uuid } from 'uuidv4';
const axios = require('axios');
const FormData = require('form-data');

const transIds = [
  // {
  //   url: "https://storage.googleapis.com/bezosusubucket/idPicture_c8f97ac2adbbb2c07d32063b0ccdf8773a23fec6-AdnanMaltiti.jpeg",
  //   idType: "GHANA_CARD",
  //   appType: "ID_CARD",
  //   userId: "7d03b236-eb2d-45bb-ac76-a797696621b4",
  // },
  // {
  //   url: "https://storage.googleapis.com/bezosusubucket/userPicture_c8f97ac2adbbb2c07d32063b0ccdf8773a23fec6-AdnanMaltiti.jpeg",
  //   idType: "GHANA_CARD",
  //   appType: "SELFIE",
  //   userId: "7d03b236-eb2d-45bb-ac76-a797696621b4",
  // },

  {
    url: 'https://storage.googleapis.com/bezosusubucket/idPicture_3367edc08e435dbc140bcebb896d0d725ea87b97-NevilleKati_786acbdcd97d16da4581f843d74fd82ce9906e7c.jpeg',
    idType: 'GHANA_CARD',
    appType: 'SELFIE',
    userId: '78a29301-67ee-4e60-b771-ab0348bcce99',
  },
];

@Console()
export class MigrateFromGoogleCloudToAzureCommand extends HttpRequestService {
  constructor(
    private em: EntityManager, //private service: MigrationService,
  ) {
    super();
  }

  @Command({
    command: 'migrate:google-to-azure',
  })
  async execute(opts?: any) {
    try {
      return await this._execute(opts);
    } catch (e) {
      console.error(e);
      return 1;
    }
  }

  async _execute(opts?: any) {
    console.log('Migration started ...');

    this.start();

    console.log('Migration Completed !! ...');
  }

  async start() {
    const chunkSize = 200;
    for (let i = 0; i < transIds.length; i += chunkSize) {
      const chunk = transIds.slice(i, i + chunkSize);

      const res = await Promise.all(
        chunk.map(async (dataInput) => {
          await this.migrateUserFiles(dataInput);
        }),
      );

      console.log('resMain', res);
    }
  }

  async migrateUserFiles(dataInput) {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOTFlNjRmMC00Y2M5LTRlMDQtYWI5ZC1hODNiYmMyZDcwNGYiLCJyb2xlcyI6WyJBZG1pbiJdLCJpYXQiOjE2Nzg4MTEwNTIsImV4cCI6MTY4MTQwMzA1Mn0.rhb6fZ8-zlAM52dH6ZllMTcJosAAnyl8ko62WHbvnt0';

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    };

    const fileName = dataInput.url.substring(
      dataInput.url.lastIndexOf('/') + 1,
    );

    // extract the extension from the file name using regex
    const extension = fileName.match(/\.(jpg|jpeg|png|gif)$/i)[0];

    const filename = `${uuid()}${extension}`;

    if (dataInput.appType == 'ID_CARD') {
      try {
        const response = await axios.get(dataInput.url, {
          responseType: 'arraybuffer',
        });

        //  console.log("GET IMAGE", response);

        const blob = response.data;

        const formData = new FormData();
        formData.append('user', blob, filename);
        formData.append('userId',dataInput.userId)

        formData.append('appType',dataInput.appType)

        const res = await axios.post(
          //        `https://apidev.bezosusu.com/api/v2/users/upload/migrate`,
          `http://localhost:4200/api/v2/users/upload/migrate`,
          formData,
          config,
        );

        console.log('RES', res.data);


        formData.delete("idPicture");
        formData.delete("userId");
        formData.delete("appType");

        return res;
      } catch (error) {
        console.log('Error reversing', error);
      }
    } else if (dataInput.appType == 'SELFIE') {
      try {
        const response = await axios.get(dataInput.url, {
          responseType: 'arraybuffer',
        });

        // console.log("GET IMAGE 2", response);
        const blob = response.data;

        const formData = new FormData();
        formData.append('idPicture', blob, filename);
        formData.append('userId',dataInput.userId)
        formData.append('appType',dataInput.appType)

        const res = await axios.post(
          //  `https://apidev.bezosusu.com/api/v2/users/upload/migrate`,
          `http://localhost:4200/api/v2/users/upload/migrate`,

          formData,
          config,
        );
        console.log('RES 2', res.data);

        formData.delete("idPicture");
        formData.delete("userId");
        formData.delete("appType");
        return res;
      } catch (error) {
        console.log('Error reversing', error);
      }
    }
  }
}
