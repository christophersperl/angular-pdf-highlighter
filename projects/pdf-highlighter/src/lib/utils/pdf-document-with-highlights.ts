export interface PdfDocumentWithHighlights {
  id: string;
  pdfDocumentPath: string;
  Highlights?: Highlight[];
}

export interface Highlight {
  id: string;
  groupId?: string;
  onPageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  containedText?: string;
  additionalInformationDisplayed?: string;
}
