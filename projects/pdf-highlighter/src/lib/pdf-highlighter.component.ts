import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  Output,
  EventEmitter,
} from '@angular/core';
import { TextLayerRenderedEvent } from './utils/text-layer-rendered-event';
import {
  PdfDocumentWithHighlights,
  Highlight,
} from './utils/pdf-document-with-highlights';
import { WindowReferenceService } from './utils/window-reference.service';
import { debounce } from './utils/debounce-decorator';

const initialPdfDocument: PdfDocumentWithHighlights = {
  id: '0',
  pdfDocumentPath: 'assets/Test.pdf',
  Highlights: [],
};

@Component({
  selector: 'lib-pdf-highlighter',
  template: `
    <pdf-viewer
      style="display: block;"
      [src]="pdfSrcPath"
      [zoom]="zoom"
      [render-text]="true"
      [render-text-mode]="1"
      [show-borders]="true"
      [external-link-target]="'blank'"
      (text-layer-rendered)="textLayerRendered($event)"
    ></pdf-viewer>
  `,
  styles: [],
})
export class PdfHighlighterComponent implements OnInit, OnDestroy {
  private pdfDocumentWithHighlights: PdfDocumentWithHighlights;
  private zoomMin: number = 0.5;
  private zoomMax: number = 1.5;

  public pdfSrcPath: string;

  zoom: number = 1;
  @Output('new-highlight-created') newHighlightCreated = new EventEmitter<
    Highlight
  >();

  @Output('new-pdfdocumentwithhighlights-created')
  newPdfDocumentWithHighlightsCreated = new EventEmitter<
    PdfDocumentWithHighlights
  >();

  constructor(
    private renderer: Renderer2,
    private elem: ElementRef,
    private ngWindow: WindowReferenceService
  ) { }

  ngOnInit() {
    document.addEventListener('keyup', e => this.keyUpHandler(e));

    this.pdfDocumentWithHighlights = initialPdfDocument;
    this.pdfSrcPath = this.pdfDocumentWithHighlights.pdfDocumentPath;

    // We use this to generate a Highlight ID based on the Java hashCode implementation on Strings.
    // https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
    Object.defineProperty(String.prototype, 'hashCode', {
      value: function () {
        var hash = 0,
          i,
          chr;
        for (i = 0; i < this.length; i++) {
          chr = this.charCodeAt(i);
          hash = (hash << 5) - hash + chr;
          hash |= 0;
        }
        return Math.abs(hash).toString(); // avoid negative values.
      },
    });
  }

  ngOnDestroy() {
    document.removeEventListener('keyup', e => this.keyUpHandler(e));
  }

  private keyUpHandler(e: KeyboardEvent) {
    if (e.key !== "h") {
      return;
    }

    const textSelection = this.ngWindow.nativeWindow.getSelection();
    const textSelectionisValidRangeOfText = !(
      textSelection.isCollapsed || textSelection.type !== 'Range'
    );

    if (textSelectionisValidRangeOfText) {
      this.appendToHighlights(textSelection);
    }
  }

  @debounce()
  private appendToHighlights(textSelection) {
    const range: Range = textSelection.getRangeAt(0);
    const page = range.startContainer.parentElement;
    const node = page.closest('.page');

    if (!(node instanceof HTMLElement)) {
      return;
    }
    const pageNumber = node.dataset.pageNumber;

    if (!pageNumber) {
      return;
    }


    const clientRects = Array.from(range.getClientRects());
    const offset = node.getBoundingClientRect();

    const highlightColor: string =
      'hsl(' + Math.random() * 360 + ', 100%, 80%)';
    const containedText: string = range.toString();

    /**
     * Different rects of same Highlight have same Class groupId.
     * The group- and highlight id's are build using
     *  - positional information,
     *  - length of document name and
     *  - the pageNumber they belong to after an _.
     */
    const groupId: string =
      ((clientRects[0].top + clientRects[0].width + clientRects[0].left)
        .toString() + this.pdfDocumentWithHighlights.pdfDocumentPath.length.toString()
          // @ts-ignore
          .hashCode() + "_" + pageNumber).replace(".", "")

    clientRects.forEach((rect) => {
      const top = rect.top + node.scrollTop - offset.top - 9; // TODO: Replace Magic Number
      const left = rect.left + node.scrollLeft - offset.left - 9;
      const width = rect.width;
      const height = rect.height;
      const id: string = (rect.top + rect.width + rect.left)
        .toString() + this.pdfDocumentWithHighlights.pdfDocumentPath.length.toString()
          // @ts-ignore
          .hashCode();

      const newHighlight: Highlight = {
        id: (id + "_" + pageNumber).replace(".", ""),
        groupId: groupId,
        onPageNumber: parseInt(pageNumber, 10),
        x: left * (1 / this.zoom),
        y: top * (1 / this.zoom),
        width: width * (1 / this.zoom),
        height: height * (1 / this.zoom),
        color: highlightColor,
        containedText: containedText,
      };

      this.newHighlightCreated.emit(newHighlight);

      this.pdfDocumentWithHighlights.Highlights = [
        ...this.pdfDocumentWithHighlights.Highlights,
        newHighlight,
      ];

      this.newPdfDocumentWithHighlightsCreated.emit(
        this.pdfDocumentWithHighlights
      );
    });
  }

  // Renders initail and when Zoom changes.
  textLayerRendered(e: TextLayerRenderedEvent): void {
    if (e.pageNumber) {
      let query = `.pdfViewer .page[data-page-number="${e.pageNumber}"] .textLayer`;
      let textLayerElementOnPage = this.elem.nativeElement.querySelector(query);
      textLayerElementOnPage.style.zIndex = '2';

      // Get the Page-Number the Highlight belongs.
      textLayerElementOnPage.addEventListener('mouseup', (e) => {
        const highlightsPageNumber = parseInt(
          e.target.parentElement
            .closest('.page')
            .getAttribute('data-page-number'),
          10
        );

        this.pdfDocumentWithHighlights.Highlights.forEach((highlight) => {
          if (highlightsPageNumber === highlight.onPageNumber) {
            const query = `.pdfViewer .page[data-page-number="${highlightsPageNumber}"] .textLayer .highlightsForPage_${highlightsPageNumber}`;
            const highlightContainerOnCorrespondingPage = this.elem.nativeElement.querySelector(
              query
            );
            let existingHighlights = highlightContainerOnCorrespondingPage.getElementsByClassName(
              'scHighlightClassHandle'
            );
            existingHighlights = [...existingHighlights];

            this.createElementAndAppendIfNotExisting(
              existingHighlights,
              highlightContainerOnCorrespondingPage,
              highlight
            );
          }
        });
      });

      this.appendHighlightContainersToTextLayers(e, textLayerElementOnPage);
      this.appendHighlightsToHighlightContainers(
        e,
        this.pdfDocumentWithHighlights
      );
    }
  }

  private appendHighlightContainersToTextLayers(
    e: TextLayerRenderedEvent<any>,
    textLayerElementOnPage: any
  ) {
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
  }

  private appendHighlightsToHighlightContainers(
    e: TextLayerRenderedEvent,
    PdfDocumentWithHighlights: PdfDocumentWithHighlights
  ) {
    PdfDocumentWithHighlights.Highlights.forEach((highlight) => {
      if (e.pageNumber === highlight.onPageNumber) {
        const query = `.pdfViewer .page[data-page-number="${e.pageNumber}"] .textLayer .highlightsForPage_${highlight.onPageNumber}`;
        let highlightContainerOnCorrespondingPage = this.elem.nativeElement.querySelector(
          query
        );

        let existingHighlights = highlightContainerOnCorrespondingPage.getElementsByClassName(
          'scHighlightClassHandle'
        );
        existingHighlights = [...existingHighlights];

        this.createElementAndAppendIfNotExisting(
          existingHighlights,
          highlightContainerOnCorrespondingPage,
          highlight
        );
      }
    });
  }

  private createElementAndAppendIfNotExisting(
    existingHighlights: Highlight[],
    highlightContainerOnCorrespondingPage: HTMLElement,
    newHighlightToAppend: Highlight
  ) {
    const existingHighlightIds = [];
    if (existingHighlights !== undefined) {
      for (const iterator of existingHighlights) {
        existingHighlightIds.push(iterator.id);
      }
    }
    highlightContainerOnCorrespondingPage.getElementsByClassName(
      'scHighlightClassHandle'
    );

    if (
      !existingHighlightIds.includes(`highlight__${newHighlightToAppend.id}`)
    ) {
      let highlightGettingAddedToCorrespondingPage = document.createElement(
        'div'
      );
      highlightGettingAddedToCorrespondingPage.id = `highlight__${newHighlightToAppend.id}`;
      highlightGettingAddedToCorrespondingPage.className = `scHighlightClassHandle groupId__${newHighlightToAppend.groupId}`;
      highlightGettingAddedToCorrespondingPage.style.position = 'absolute';
      highlightGettingAddedToCorrespondingPage.style.backgroundColor =
        newHighlightToAppend.color;
      highlightGettingAddedToCorrespondingPage.style.left =
        (newHighlightToAppend.x - 2) * this.zoom + 'px'; // TODO: replace Magic Numbers.
      highlightGettingAddedToCorrespondingPage.style.top =
        (newHighlightToAppend.y - 2) * this.zoom + 'px'; // TODO: replace Magic Numbers.
      highlightGettingAddedToCorrespondingPage.style.width =
        (newHighlightToAppend.width + 4) * this.zoom + 'px'; // TODO: replace Magic Numbers.
      highlightGettingAddedToCorrespondingPage.style.height =
        (newHighlightToAppend.height + 2) * this.zoom + 'px'; // TODO: replace Magic Numbers.
      highlightGettingAddedToCorrespondingPage.style.zIndex = '4';
      highlightGettingAddedToCorrespondingPage.title =
        newHighlightToAppend.groupId;
      highlightContainerOnCorrespondingPage.appendChild(
        highlightGettingAddedToCorrespondingPage
      );
    }
  }

  /**
   * Rerenders the View
   * by chanching it's scale.
   */
  private flipflop: boolean = false;
  private rerenderView() {
    if (this.flipflop) {
      this.zoom -= 0.000001;
    } else {
      this.zoom += 0.000001;
    }
    this.flipflop = !this.flipflop;
  }


  /************* Functions meant for use in Parent Component ****************
   * Follwing functions are meant to be used inside Parent Component.       *
   * Use @ViewChild in Parent component to access this Functions from there.*
   **************************************************************************/

  /**
   * Increases the Scale of the PDF-Document.
   */
  public zoomIn(): void {
    if (this.zoom < this.zoomMax) {
      this.zoom += 0.05;
    }
  }

  /**
   * Decreases the Scale of the PDF-Document.
   */
  public zoomOut(): void {
    if (this.zoom > this.zoomMin) {
      this.zoom -= 0.05;
    }
  }

  /**
   * Reset the Highlights on current PDF-Document.
   */
  public resetHighlights() {
    this.pdfDocumentWithHighlights.Highlights = [];
    this.rerenderView();
    this.newPdfDocumentWithHighlightsCreated.emit(
      this.pdfDocumentWithHighlights
    );
  }

  /**
   * Set an Pdf-Document wirh Highlights to be shown in the Pdf-Viewer.
   * @param pdfDocumentWithHighlights The Pdf Document that should be displayed.
   */
  public setPdfDocumentWithHighlights(
    pdfDocumentWithHighlights: PdfDocumentWithHighlights
  ) {
    this.pdfDocumentWithHighlights = pdfDocumentWithHighlights;
    this.pdfSrcPath = this.pdfDocumentWithHighlights.pdfDocumentPath;
    this.rerenderView();
    this.newPdfDocumentWithHighlightsCreated.emit(
      this.pdfDocumentWithHighlights
    );
  }

  /**
   * Delets an Highlight by it's groupId.
   * @param groupId groupId of Highlight which should be deleted.
   */
  public deleteHighlightByGroupId(groupId: string) {
    this.pdfDocumentWithHighlights.Highlights = this.pdfDocumentWithHighlights.Highlights.filter(
      (e) => (e.groupId !== groupId ? true : false)
    );
    this.rerenderView();
    this.newPdfDocumentWithHighlightsCreated.emit(
      this.pdfDocumentWithHighlights
    );
  }

  /**
   * Adds Additional Information to Highlight.
   * @param additionalInformationDisplayed Additional Information.
   * @param id Id of Highlight which should be deleted.
   */
  public addAdditionalInformationToHighlightById(additionalInformationDisplayed: string, id: string) {
    this.pdfDocumentWithHighlights.Highlights
      .filter((e) => (e.id === id ? true : false))
      .map(e => e.additionalInformationDisplayed = additionalInformationDisplayed);
  }
}
