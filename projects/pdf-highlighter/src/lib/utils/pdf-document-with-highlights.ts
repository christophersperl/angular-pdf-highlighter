export interface PdfDocumentWithHighlights {
  id: string;
  pdfDocumentPath: string;
  Highlights?: Highlight[];
}

interface Highlight {
  id: string;
  onPageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  containedText?: string;
  additionalInformationDisplayed?: string;
}
