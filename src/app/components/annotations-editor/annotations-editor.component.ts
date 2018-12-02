import {Component, Input, OnInit} from '@angular/core';
import {Annotation} from '../../interfaces/annotation/annotation';

import {DataService} from '../../services/data/data.service';
import {AnnotationService} from '../../services/annotation/annotation.service';
import {BabylonService} from '../../services/babylon/babylon.service';
import {CameraService} from '../../services/camera/camera.service';
import {AnnotationmarkerService} from '../../services/annotationmarker/annotationmarker.service';


@Component({
  selector: 'app-annotations-editor',
  templateUrl: './annotations-editor.component.html',
  styleUrls: ['./annotations-editor.component.scss']
})
export class AnnotationsEditorComponent implements OnInit {

  @Input() annotation: Annotation;


  public collapsed = true;
  public editMode = false;
  public labelMode = 'edit';
  public labelModeText = 'edit';
  public preview = '';

  constructor(private dataService: DataService, private annotationService: AnnotationService,
              private babylonService: BabylonService, private cameraService: CameraService,
              private annotationmarkerService: AnnotationmarkerService
  ) {
  }

  ngOnInit() {
    this.preview = this.annotation.preview;
  }

  public getValidation(validated) {
    if (validated) {
      this.annotation.validated = true;
      return 'validated';
    } else {
      this.annotation.validated = false;
      return 'unvalidated';
    }
  }

  public selectPerspective() {
    this.annotation.cameraPosition = this.cameraService.getActualCameraPosAnnotation();
    this.annotationmarkerService.redrawMarker(this.annotation);
    this.babylonService.createPreviewScreenshot(220).then(detailScreenshot => {
      this.preview = detailScreenshot;
    });
  }

  public deleteAnnotation(): void {
    this.annotationService.deleteAnnotation(this.annotation);
  }

  public toggleEditViewMode() {
    if (this.editMode) {
      this.editMode = false;
      this.labelMode = 'edit';
      this.labelModeText = 'edit';
      this.save();
    } else {
      this.collapsed = false;
      this.editMode = true;
      this.labelMode = 'remove_red_eye';
      this.labelModeText = 'view';
    }
  }

  private save(): void {
    this.dataService.updateAnnotation(this.annotation._id, this.annotation.title, this.annotation.description,
      this.preview, this.annotation.cameraPosition, this.annotation.validated);
  }

  public onSubmit(event) {
    console.log(event);
  }
}


