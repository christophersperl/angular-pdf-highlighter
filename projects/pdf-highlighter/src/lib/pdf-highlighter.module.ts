import { NgModule } from '@angular/core';
import { PdfHighlighterComponent } from './pdf-highlighter.component';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

// PDF.js Viewer
import { PdfViewerModule } from "./pdf-viewer/pdf-viewer.module";

@NgModule({
  declarations: [PdfHighlighterComponent],
  imports: [PdfViewerModule],
  exports: [PdfHighlighterComponent]
})
export class PdfHighlighterModule { }
