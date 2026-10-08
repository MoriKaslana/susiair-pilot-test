import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { diffInDays } from '../common/utils/date.util';
import { DataService } from '../data/data.service';

export type DocumentStatus = 'safe' | 'soon' | 'expired';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly data: DataService,
    private readonly config: ConfigService,
  ) {}

  getDocuments() {
    // Status is computed against APP_TODAY. The "today" stored inside
    // mock-documents.json is deliberately ignored (the brief says today = 15 May).
    const today = this.config.getOrThrow<string>('appToday');
    const warningDays = this.data.warningDays;

    return {
      today,
      warningDays,
      documents: this.data.documents.map((doc) => {
        const daysRemaining = diffInDays(doc.expiryDate, today);
        return {
          id: doc.id,
          label: doc.label,
          expiryDate: doc.expiryDate,
          daysRemaining,
          status: this.classify(daysRemaining, warningDays),
        };
      }),
    };
  }

  /** <= 0 days left is expired, <= warningDays is soon, otherwise safe. */
  classify(daysRemaining: number, warningDays: number): DocumentStatus {
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= warningDays) return 'soon';
    return 'safe';
  }
}
