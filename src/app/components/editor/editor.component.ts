import {Component, HostBinding, Input, OnInit, ViewChild} from '@angular/core';
import {OverlayService} from '../../services/overlay/overlay.service';
import {AnnotationService} from '../../services/annotation/annotation.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import {saveAs} from 'file-saver';

import {environment} from '../../../environments/environment.prod';
import {MatDialog} from '@angular/material';
import {DialogDeleteAnnotationsComponent} from '../dialogs/dialog-delete-annotations/dialog-delete-annotations.component';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss']
})
export class EditorComponent implements OnInit {

  @HostBinding('class.is-open') private isOpen = false;
  @Input() modelFileName: string;
  @ViewChild('tabGroup') tabGroup;


  public version: string = environment.version;

  public selectedTab;
  public meshSettingsMode;
  public defaultAnnotationsMode;


  constructor(private overlayService: OverlayService,
              public annotationService: AnnotationService,
              public dialog: MatDialog) {
  }

  ngOnInit() {

    this.overlayService.editor.subscribe(editorIsOpen => {
      this.isOpen = editorIsOpen;
      this.annotationService.annotationMode(this.isOpen);
    });

    this.overlayService.editorSetting.subscribe(meshSettingsMode => {
      this.meshSettingsMode = meshSettingsMode;
      if (this.isOpen) {
        if (meshSettingsMode) {
          this.annotationService.annotationMode(false);
          this.changeTab(1);
        } else {
          this.annotationService.annotationMode(true);
        }
      }
    });

    this.overlayService.defaultAnnotations.subscribe(annotationsMode => {
      this.defaultAnnotationsMode = annotationsMode;
      if (this.isOpen && annotationsMode) {
        this.annotationService.annotationMode(true);
        this.changeTab(0);
      }
    });
  }

  drop(event: CdkDragDrop<string[]>) {

    moveItemInArray(this.annotationService.annotations, event.previousIndex, event.currentIndex);
    this.annotationService.changedRankingPositions();
  }

  private changeTab(tabIndex) {
    console.log('Gerade ausgewählt: ', this.tabGroup.selectedIndex, tabIndex);

    if (tabIndex <= 3 && tabIndex >= 0) {
      this.tabGroup.selectedIndex = tabIndex;
    }
  }

  public exportAnnotations() {
    saveAs(new Blob([this.annotationService.exportAnnotations()],
      {type: 'text/plain;charset=utf-8'}), 'annotations.json');
  }

  public importAnnotations(files: FileList): void {

    const fileToUpload = files.item(0),
      fileReader: FileReader = new FileReader();

    fileReader.onload = (e) => {

      if (typeof fileReader.result === 'string') {

        this.deleteAnnotations();
        this.annotationService.importAnnotations(fileReader.result);
      }
    };

    if (fileToUpload) {
      fileReader.readAsText(fileToUpload);
    }

  }

  public deleteAnnotations() {

    const dialogRef = this.dialog.open(DialogDeleteAnnotationsComponent);

    dialogRef.afterClosed().subscribe(deleteAll => {

      if (deleteAll) {
        this.annotationService.deleteAllAnnotations();
      }
    });
  }

}
