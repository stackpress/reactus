import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ReactusService } from './reactus/reactus.service.js';
import { Response } from 'express'

describe('AppController', () => {
  let appController: AppController;
  let reactusServiceMock: Partial<ReactusService>;

  beforeEach(async () => {
    reactusServiceMock = {
      render: jest.fn().mockResolvedValue('<html><body>Mocked Page</body></html>'),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ReactusService,
          useValue: reactusServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('should render the home page', async () => {
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await appController.home(res);

    expect(reactusServiceMock.render).toHaveBeenCalledWith('@/pages/home', { title: 'Home' });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(res.end).toHaveBeenCalledWith('<html><body>Mocked Page</body></html>');
  });

  it('should render the about page', async () => {
    const res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    } as unknown as Response;

    await appController.about(res);

    expect(reactusServiceMock.render).toHaveBeenCalledWith('@/pages/about', { title: 'About' });
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
    expect(res.end).toHaveBeenCalledWith('<html><body>Mocked Page</body></html>');
  });
});
