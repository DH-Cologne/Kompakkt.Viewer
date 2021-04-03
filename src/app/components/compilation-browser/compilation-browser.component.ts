import { Component } from '@angular/core';

import { ProcessingService } from '../../services/processing/processing.service';

import { isEntity, isCompilation, ICompilation } from '~common/interfaces';

@Component({
  selector: 'app-compilation-browser',
  templateUrl: './compilation-browser.component.html',
  styleUrls: ['./compilation-browser.component.scss'],
})
export class CompilationBrowserComponent {
  public compilation: ICompilation | undefined;

  public isEntity = isEntity;

  constructor(public processing: ProcessingService) {
    this.processing.compilation$.subscribe(compilation => (this.compilation = compilation));
  }

  get currentEntities() {
    if (!isCompilation(this.compilation)) return [];
    return Object.values(this.compilation.entities);
  }

  get entityCount() {
    return this.currentEntities.length;
  }
}
