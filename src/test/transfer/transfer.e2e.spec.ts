import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { MyLoggerService } from '../../logger.service';
import { DataSourceOptions, EntityManager } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectionSource } from '../../../ormconfig';

let tokenStore;
let verificationIdStore;
describe('TRANSFER CONTROLLER', () => {
  let app: INestApplication;
  let entityManager: EntityManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: async () => (await connectionSource) as DataSourceOptions,
        }),
        AppModule,
      ],
    }).compile();

    entityManager = moduleFixture.get<EntityManager>(EntityManager);

    app = moduleFixture.createNestApplication();
    app.useLogger(new MyLoggerService('bezoSusuCoreTestingApi'));
    app.setGlobalPrefix('api/v2');

    await app.init();
  });

  beforeEach(async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v2/users/login')
      .send({
        phone: '233559876496',
        password: 'demo2017',
      });
    tokenStore = response.body.token;

    console.log("tokenStore",tokenStore)

    const verfRes = await request(app.getHttpServer())
    .get('/api/v2/users/pin/verify/4786')
    .set('Accept', 'application/json')
    .set('Authorization', 'Bearer ' + tokenStore)
    .set('Content-Type', 'application/json')

    verificationIdStore=verfRes.body.verificationId
 
  });
  // afterEach(async () => {
  //   await app.close();
  // });

  afterAll(async () => {
    await app.close();
  });

  describe('USER HAS SUFFICIENT BALANCE', () => {
    it('should return 200 with body response', async () => {
      //console.log('app.getHttpServer()',await request(app.getHttpServer()).post('/users/login'))

   

      const response = await request(app.getHttpServer())
        .post('/api/v2/user/transfer')
        .set('Accept', 'application/json')
        .set('Authorization', 'Bearer ' + tokenStore)
        .set('Content-Type', 'application/json')
        .send({
          transferAccountId: '326f7b1e-8f92-4510-982c-da112dbf5a0f',
          amount: 1,
          verificationId:  verificationIdStore,
          narration: 'salary',
          channel: 'web',
        });
        console.log("response after transfer>>> ",response.body)

        expect(response.body).toHaveProperty('statusCode','00');
        expect(response.body).toHaveProperty('message','Transaction successful');
         expect(response.body).toHaveProperty('trxnRef');
         expect(response.body).toHaveProperty('userRef');
    });
  });


});
