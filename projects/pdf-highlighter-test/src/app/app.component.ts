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
  private selectedHighlightId = "";

  // ######### Example: Use Events to implement Overview of Highlights ###################
  handleNewHighlight(e: Highlight) {
    console.log(e);
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
        color: "hsl(59.27958500254291, 100%, 80%)",
        containedText: "Stet clita kasd gubergren, no sea takimata sanctus ",
        groupId: "108843466186523441573_1",
        height: 14.666656494140629,
        id: "108843466186523441573_1",
        onPageNumber: 1,
        width: 293.53610229492193,
        x: 325.84298706054693,
        y: 424.61807250976574,
        additionalInformationDisplayed: "This is Text added using the <<Add Description>> Button."
      },
    ],
  };
  setPdfDocument() {
    this.pdfViewer.setPdfDocumentWithHighlights(this.demoPdfDocument);
  }

  deleteHighlight(groupId: string) {
    this.pdfViewer.deleteHighlightByGroupId(groupId);
  }


  // Example of how to Add Description.
  setSelectedHighlightId(selectedHighlightId: string) {
    // Store Id of Highlight where Add Description Button get clicked.
    this.selectedHighlightId = selectedHighlightId
  }

  addAdditionalInformation(text: string) {
    this.pdfViewer.addAdditionalInformationToHighlightById(text, this.selectedHighlightId);
  }
}
