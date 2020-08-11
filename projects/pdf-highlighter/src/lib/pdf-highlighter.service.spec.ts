import { TestBed } from '@angular/core/testing';

import { PdfHighlighterService } from './pdf-highlighter.service';

describe('PdfHighlighterService', () => {
  let service: PdfHighlighterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PdfHighlighterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
