import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Imports for Test-Demo.
import { AngularSplitModule } from 'angular-split';

// Import the Highlighter.
import { PdfHighlighterModule } from 'pdf-highlighter';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PdfHighlighterModule,
    AngularSplitModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
