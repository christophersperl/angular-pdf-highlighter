import { Component, ViewChild } from '@angular/core';
import {
  PdfHighlighterComponent,
  PdfDocumentWithHighlights,
  Highlight,
} from 'pdf-highlighter';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'pdf-highlighter-test';
  highlights = [];

  // ######### Example: Use Events to implement Overview of Highlights ###################
  handleNewHighlight(e: Highlight) {
    // console.log(e);
  }

  handleNewDocument(e: PdfDocumentWithHighlights) {
    // console.log(e);
    this.highlights = [];
    for (const highlight of e.Highlights) {
      if (highlight.id === highlight.groupId) {
        this.highlights = [...this.highlights, highlight];
      }
    }
  }

  // ######### Example: Use Methods provided to implement functionality ###################
  @ViewChild('pdfViewer') pdfViewer: PdfHighlighterComponent;

  increaseZoom() {
    this.pdfViewer.zoomIn();
  }

  decreaseZoom() {
    this.pdfViewer.zoomOut();
  }

  resetHighlights() {
    this.pdfViewer.resetHighlights();
  }

  demoPdfDocument: PdfDocumentWithHighlights = {
    id: '0',
    pdfDocumentPath: 'assets/Test2.pdf',
    Highlights: [
      {
        color: 'hsl(282.8976430074274, 100%, 80%)',
        containedText: 'User! ;-) ',
        groupId: '17471359521',
        height: 14.799972992995757,
        id: '17471359521',
        onPageNumber: 1,
        width: 53.36115269353481,
        x: 383.5097178086416,
        y: 376.88713531989595,
      },
    ],
  };
  setPdfDocument() {
    this.pdfViewer.setPdfDocumentWithHighlights(this.demoPdfDocument);
  }

  deleteHighlight(groupId: string) {
    this.pdfViewer.deleteHighlightByGroupId(groupId);
  }
}
