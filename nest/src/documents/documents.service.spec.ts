import { ConfigService } from '@nestjs/config';
import { DataService } from '../data/data.service';
import { DocumentsService } from './documents.service';

const configFor = (today: string) =>
  ({ getOrThrow: () => today }) as unknown as ConfigService;

describe('DocumentsService.classify', () => {
  const service = new DocumentsService({} as DataService, configFor('2026-05-15'));

  it('is expired on the expiry day and after', () => {
    expect(service.classify(0, 30)).toBe('expired');
    expect(service.classify(-1, 30)).toBe('expired');
  });

  it('is soon from 1 day up to and including the warning window', () => {
    expect(service.classify(1, 30)).toBe('soon');
    expect(service.classify(30, 30)).toBe('soon');
  });

  it('is safe beyond the warning window', () => {
    expect(service.classify(31, 30)).toBe('safe');
  });
});

describe('DocumentsService with the provided data', () => {
  const data = new DataService();
  data.onModuleInit();

  it('uses APP_TODAY (2026-05-15), not the date inside the JSON file', () => {
    const r = new DocumentsService(data, configFor('2026-05-15')).getDocuments();
    expect(r.documents.map((d) => d.status)).toEqual([
      'safe',
      'safe',
      'soon',
      'soon',
      'expired',
    ]);
    expect(r.documents.map((d) => d.daysRemaining)).toEqual([152, 224, 14, 27, -14]);
  });

  it('follows the configured today', () => {
    const r = new DocumentsService(data, configFor('2026-05-31')).getDocuments();
    expect(r.documents.map((d) => d.status)).toEqual([
      'safe',
      'safe',
      'expired',
      'soon',
      'expired',
    ]);
  });
});
