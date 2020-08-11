import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { TextLayerRenderedEvent } from './utils/text-layer-rendered-event';
import { PdfDocumentWithHighlights } from './utils/pdf-document-with-highlights';
import { WindowReferenceService } from './utils/window-reference.service';
import { debounce } from './utils/debounce-decorator';

// stub for implementation of highlight rendering.
const currentPDFDocument: PdfDocumentWithHighlights = {
  id: '1',
  pdfDocumentPath: 'assets/Test.pdf',
  Highlights: [

  ],
};

@Component({
  selector: 'lib-pdf-highlighter',
  template: `
  <pdf-viewer
  style="display: block;"
  [src]="pdfSrc"
  [zoom]="zoom"
  [render-text]="true"
  [render-text-mode]="1"
  [show-borders]="true"
  [external-link-target]="'blank'"
  (text-layer-rendered)="textLayerRendered($event)"
></pdf-viewer>
  `,
  styles: [
  ]
})
export class PdfHighlighterComponent implements OnInit, OnDestroy {

  PdfDocumentWithHighlights: PdfDocumentWithHighlights;
  pdfSrc = ""

  @Output() newItemEvent = new EventEmitter<string>();

  zoom = 1;
  zoomMin = 0.5;
  zoomMax = 1.5;

  constructor(
    private renderer: Renderer2,
    private elem: ElementRef,
    private ngWindow: WindowReferenceService
  ) {
    // TODO: switch maybe to MD5
    Object.defineProperty(String.prototype, 'hashCode', {
      value: function () {
        var hash = 0, i, chr;
        for (i = 0; i < this.length; i++) {
          chr = this.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0;
        }
        return Math.abs(hash).toString();
      }
    });

  }

  // adding event listener to the text Layers,
  ngOnInit() {
    // load existing Highlightings
    this.PdfDocumentWithHighlights = currentPDFDocument;
    this.pdfSrc = this.PdfDocumentWithHighlights.pdfDocumentPath;

    document.addEventListener('mouseup', this.onSelectionChange());
  }
  // and remove them.
  ngOnDestroy() {
    document.removeEventListener('mouseup', this.onSelectionChange());
  }

  private onSelectionChange(): (this: Document, ev: Event) => any {
    return () => {
      const textSelection = this.ngWindow.nativeWindow.getSelection();

      // not selected a range with text
      if (textSelection.isCollapsed || textSelection.type !== 'Range') {
        return;
      }
      this.actOnSelectionChanged(textSelection);
    };
  }

  /**
   * This function acts when a new text passage get's selected
   * cause this event get's emitted a lot we've to debouce it.
   * @param textSelection the Range Selected with Mouse in PDF - Document.
   */
  @debounce()
  private actOnSelectionChanged(textSelection) {

    const range: Range = textSelection.getRangeAt(0);
    const page = range.startContainer.parentElement

    const node = page.closest(
      '.page'
    );

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const _pageNumber = node.dataset.pageNumber;

    if (!_pageNumber) {
      return;
    }

    let clientRects = Array.from(range.getClientRects());
    const offset = node.getBoundingClientRect();

    clientRects.forEach(rect => {
      const _top = rect.top + node.scrollTop - offset.top - 9; // TODO: Replace Magic Number of Border Width
      const _left = rect.left + node.scrollLeft - offset.left - 9;
      const _width = rect.width;
      const _height = rect.height;
      const _id: string = (rect.top + rect.width + rect.left).toString()

      const newHighlight = {
        // @ts-ignore
        id: _id.hashCode(),
        onPageNumber: parseInt(_pageNumber, 10),
        x: _left * (1 / this.zoom),
        y: _top * (1 / this.zoom),
        width: _width * (1 / this.zoom),
        height: _height * (1 / this.zoom),
        color: ('#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'))
      }

      this.PdfDocumentWithHighlights.Highlights = [...this.PdfDocumentWithHighlights.Highlights, newHighlight]

    })

  }

  /**
   *  zoom is also used to scale the Highlights.
   */
  zoomIn() {
    if (this.zoom < this.zoomMax) {
      this.zoom += 0.05;
    }
  }
  zoomOut() {
    if (this.zoom > this.zoomMin) {
      this.zoom -= 0.05;
    }
  }

  /**
   * The Text Layer is rendered initially
   * and also every time the Zoom changes.
   * @param e Event when a page finished rendering.
   */
  textLayerRendered(e: TextLayerRenderedEvent) {
    if (e.pageNumber) {
      let query = `.pdfViewer .page[data-page-number="${e.pageNumber}"] .textLayer`;
      let textLayerElementOnPage = this.elem.nativeElement.querySelector(
        query
      );
      textLayerElementOnPage.style.zIndex = '2';

      // on mouseup, new highlights to be rendereres on corresponding page.
      textLayerElementOnPage.addEventListener("mouseup", (e) => {
        const currentPage = parseInt(e.target.parentElement.closest(".page").getAttribute("data-page-number"), 10);
        this.PdfDocumentWithHighlights.Highlights.forEach((element) => {
          if (currentPage === element.onPageNumber) {
            let query = `.pdfViewer .page[data-page-number="${currentPage}"] .textLayer .highlightsForPage_${currentPage}`;
            let highlightContainerOnCorrespondingPage = this.elem.nativeElement.querySelector(
              query
            );

            let existingHighlights = highlightContainerOnCorrespondingPage.getElementsByClassName("scHighlightClassHandle");
            existingHighlights = [...existingHighlights];


            this.createElementAndAppendIfNotExisting(existingHighlights, highlightContainerOnCorrespondingPage, element);
          }
        });

      })


      let divContainingTheTextHighlights = document.createElement('div');
      divContainingTheTextHighlights.className = `highlightsForPage_${e.pageNumber}`;
      divContainingTheTextHighlights.style.pointerEvents = 'none';
      divContainingTheTextHighlights.style.position = 'absolute';
      divContainingTheTextHighlights.style.zIndex = '1';
      divContainingTheTextHighlights.style.left = '0';
      divContainingTheTextHighlights.style.height =
        textLayerElementOnPage.style.height;
      divContainingTheTextHighlights.style.width =
        textLayerElementOnPage.style.width;
      textLayerElementOnPage.appendChild(divContainingTheTextHighlights);


      // after inserting the "divContainingTheTextHighlights" we start adding highlights.
      this.addHighlightsToPages(e, this.PdfDocumentWithHighlights);
    }
  }

  addHighlightsToPages(e: TextLayerRenderedEvent, PdfDocumentWithHighlights: PdfDocumentWithHighlights) {
    PdfDocumentWithHighlights.Highlights.forEach((element) => {
      if (e.pageNumber === element.onPageNumber) {
        let query = `.pdfViewer .page[data-page-number="${e.pageNumber}"] .textLayer .highlightsForPage_${element.onPageNumber}`;
        let highlightContainerOnCorrespondingPage = this.elem.nativeElement.querySelector(
          query
        );

        let existingHighlights = highlightContainerOnCorrespondingPage.getElementsByClassName("scHighlightClassHandle");
        existingHighlights = [...existingHighlights];

        this.createElementAndAppendIfNotExisting(existingHighlights, highlightContainerOnCorrespondingPage, element);
      }
    });
  }

  private createElementAndAppendIfNotExisting(existingHighlights, highlightContainerOnCorrespondingPage, element) {
    const existingHighlightIds = [];
    if (existingHighlights !== undefined) {
      for (const iterator of existingHighlights) {
        existingHighlightIds.push(iterator.id);
      }
    }
    highlightContainerOnCorrespondingPage.getElementsByClassName("scHighlightClassHandle");


    if (!existingHighlightIds.includes(`highlight__${element.id}`)) {
      let highlightGettingAddedToCorrespondingPage = document.createElement(
        'div'
      );
      highlightGettingAddedToCorrespondingPage.id = `highlight__${element.id}${element.onPageNumber}`;
      highlightGettingAddedToCorrespondingPage.className =
        'scHighlightClassHandle';
      highlightGettingAddedToCorrespondingPage.style.position = 'absolute';
      highlightGettingAddedToCorrespondingPage.style.backgroundColor =
        element.color;
      highlightGettingAddedToCorrespondingPage.style.left =
        element.x * this.zoom + 'px';
      highlightGettingAddedToCorrespondingPage.style.top =
        element.y * this.zoom + 'px';
      highlightGettingAddedToCorrespondingPage.style.width =
        element.width * this.zoom + 'px';
      highlightGettingAddedToCorrespondingPage.style.height =
        element.height * this.zoom + 'px';
      highlightGettingAddedToCorrespondingPage.style.zIndex = '4';
      highlightContainerOnCorrespondingPage.appendChild(
        highlightGettingAddedToCorrespondingPage
      );
    }
  }
}
