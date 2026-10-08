import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

const makeHost = (url = '/some/path') => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ originalUrl: url }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
};

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('shapes an HttpException', () => {
    const { host, status, json } = makeHost('/missing');
    filter.catch(new NotFoundException('Nothing here'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'Not Found',
      message: 'Nothing here',
      path: '/missing',
      timestamp: expect.any(String),
    });
  });

  it('keeps the array of validation messages', () => {
    const { host, json } = makeHost();
    filter.catch(new BadRequestException(['a is wrong', 'b is wrong']), host);
    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: ['a is wrong', 'b is wrong'],
    });
  });

  it('passes through 4xx errors from the body parser', () => {
    const { host, status, json } = makeHost();
    filter.catch({ status: 400, message: 'Unexpected token' }, host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0].message).toBe('Unexpected token');
  });

  it('hides the details of unexpected errors behind a 500', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { host, status, json } = makeHost();
    filter.catch(new Error('database password is hunter2'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0][0]).toMatchObject({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Internal server error',
    });
  });
});
