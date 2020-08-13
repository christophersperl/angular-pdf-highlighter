import { Component, ViewChild } from '@angular/core';
import { PdfHighlighterComponent } from "pdf-highlighter";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'pdf-highlighter-test';
  highlights = [];

  // ######### Example: Use Events to implement Overview of Highlights ###################
  handleNewHighlight(e) {
    // console.log(e);
  }

  handleNewDocument(e) {
    this.highlights = [];
    for (const element of e.Highlights) {
      if (element.id === element.groupId) {
        // console.log(element)
        this.highlights = [...this.highlights, element]
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
    this.pdfViewer.resetHighlights()
  }
}
