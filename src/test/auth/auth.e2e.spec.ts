import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { MyLoggerService } from '../../logger.service';
import { DataSourceOptions, EntityManager } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { connectionSource } from '../../../ormconfig';

const url = `http://localhost:4200/api/v2/`;
describe('AUTH CONTROLLER', () => {
  let app: INestApplication;
  let entityManager: EntityManager;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: async () => (await connectionSource) as DataSourceOptions,
        }),
        AppModule
      
      ],

    }).compile();

    entityManager = moduleFixture.get<EntityManager>(EntityManager);

    app = moduleFixture.createNestApplication();
    app.useLogger(new MyLoggerService('bezoSusuCoreTestingApi'));
    app.setGlobalPrefix('api/v2');

    await app.init();
  });
  

  // afterEach(async () => {
  //   await app.close();
  // });

  // afterAll(async () => {
  //   await app.close();
  // });

  


  describe('SIGN UP WHEN USER IS DOES NOT EXIST (BY PHONE)', () => {

 
    
    it('/users/signup - ALL DETAILS ARE', async () => {

      const query=`DELETE FROM auth_user_entity where phone='233559876496'`
      const resOnly= await entityManager.query(query)

     

      const response = await request(app.getHttpServer())
        .post(`/api/v2/users/signup`)
        .send({
          firstName: 'Nimo',
          lastName: 'Stephen',
          phone_number: '233559876496',
          password: 'demo2017',
          gender: 'male',
          country: 'Ghana',
          occupation: 'student',
          gpsAddress: 'G-A-467-6227',
          homeAddress: '40 Osakuman st',
          bezoSource: 'instagram',
          channel: 'ios',
        })

        console.log("response >>>>",JSON.stringify(response))

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');

      // You can add additional assertions as per your requirements
    });

    it('/users/signup - Wrong Details are provided. should return 400 ', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v2/users/signup`)
        .send({
          firstName: 'Nimo',
          lastName: 'Stephen',
          phone_number: '233559876496',
          password: 'demo',
          gender: 'male',
          country: 'Ghana',
          occupation: 'student',
          gpsAddress: 'G-A-467-6227',
          homeAddress: '40 Osakuman st',
          bezoSource: 'instagram',
          channel: 'ios',
        })
        .expect(HttpStatus.BAD_REQUEST);

    

      // You can add additional assertions as per your requirements
    });
  });

  describe('SIGN UP WHEN USER EXIST (BY PHONE)', () => {
    it('shoule return 400', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v2/users/signup`)
        .send({
          firstName: 'Nimo',
          lastName: 'Stephen',
          phone_number: '233559876496',
          password: 'demo2017',
          gender: 'male',
          country: 'Ghana',
          occupation: 'student',
          gpsAddress: 'G-A-467-6227',
          homeAddress: '40 Osakuman st',
          bezoSource: 'instagram',
          channel: 'ios',
        })
        .expect(HttpStatus.BAD_REQUEST);

      // You can add additional assertions as per your requirements
    });
  });

  describe('USER HAS CORRECT CREDENTIALS ', () => {
    it('should return token and refreshToken', async () => {
      //console.log('app.getHttpServer()',await request(app.getHttpServer()).post('/users/login'))
      const response = await request(app.getHttpServer())
        .post('/api/v2/users/login')
        .send({
          phone: '233559876496',
          password: 'demo2017',
        })
       

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
    });
  });

  describe('USER HAS WRONG  CREDENTIALS', () => {
    it('/users/login', async () => {
      //console.log('app.getHttpServer()',await request(app.getHttpServer()).post('/users/login'))
    
      const response = await request(app.getHttpServer())
        .post('/api/v2/users/login')
        .send({
          phone: '233559876496',
          password: 'demo2019',
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          "The credentials you entered don't match our records. Please try again",
        error: 'Bad Request',
      });

      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
    });
  });
});
