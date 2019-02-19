import {Component, Input, OnInit} from '@angular/core';
import {AnnotationService} from '../../services/annotation/annotation.service';
import {BabylonService} from '../../services/babylon/babylon.service';
// 11/02/19
import {Annotation} from 'src/app/interfaces/annotation2/annotation2';
// import {Annotation} from '../../interfaces/annotation/annotation';
import {DataService} from '../../services/data/data.service';

import {Vector3, Matrix} from 'babylonjs';
// 15/02/19
import { AnnotationmarkerService } from 'src/app/services/annotationmarker/annotationmarker.service';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss']
})

export class AnnotationComponent implements OnInit {

  @Input() annotation: Annotation;

  public editMode = false;
  public labelMode = 'edit';
  public labelModeText = 'edit';
  public positionTop = 0;
  public positionLeft = 0;
  public visibility: boolean;
  public id = '';
  public opacity = '0';

  constructor(private dataService: DataService,
              private annotationService: AnnotationService,
              private babylonService: BabylonService,
              private annotationmarkerService: AnnotationmarkerService
              ) {
    // 15/02/19
    // CLOSED ANNOTATION-CARDS ON LOADED-MODEL
    this.visibility = false;
  }

  ngOnInit() {

    if (this.annotation) {
      this.id = this.annotation._id;

      // 15/02/19
      // EditMode on newly creaded annotation (double click)
      if (this.annotationmarkerService.open_popup === this.annotation._id){
        this.visibility = true;
        this.editMode = true;
        this.labelMode = 'remove_red_eye';
        this.labelModeText = 'view';
      }
    }

    this.opacity = '1';

    setInterval(() => {
      this.setPosition(this.annotation);
    }, 15);
  }

  public setPosition(annotation: Annotation) {

    const scene = this.babylonService.getScene();

    if (!scene) {
      return false;
    }

    const getMesh = scene.getMeshByName(annotation._id + '_pick');

    if (getMesh != null) {

      const engine = this.babylonService.getEngine();

      const p = Vector3.Project(
        getMesh.getBoundingInfo().boundingBox.centerWorld,
        Matrix.Identity(),
        scene.getTransformMatrix(),
        scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      );

      this.positionTop = Math.round(p.y) + 5;
      this.positionLeft = Math.round(p.x) + 5;
    }
  }

  public visabilityAnnotationCard(visibility: boolean) {

    this.visibility = visibility;
    this.opacity = '1';
  }

  public deleteAnnotation(): void {

    this.opacity = '0';
    this.annotationService.deleteAnnotation(this.annotation);
  }

  private closeAnnotation(): void {

    this.opacity = '0';
    this.visibility = false;
  }

  public toggleEditViewMode() {

    if (this.editMode) {

      this.editMode = false;
      this.labelMode = 'edit';
      this.labelModeText = 'edit';
      this.save();
    } else {

      this.editMode = true;
      this.labelMode = 'remove_red_eye';
      this.labelModeText = 'view';
    }
  }

  public setEditMode(mode: boolean) {
    if (!mode && this.editMode) {
      this.editMode = false;
      this.labelMode = 'edit';
      this.labelModeText = 'edit';
      this.save();
    } else if (mode && !this.editMode) {
      this.editMode = true;
      this.labelMode = 'remove_red_eye';
      this.labelModeText = 'view';
    } else {
      return;
    }
  }

  private save(): void {
    // 11/02/19
    this.dataService.updateAnnotation(this.annotation._id, this.annotation.body.content.title, this.annotation.body.content.description);
  }

  public onSumbit(event) {
    console.log(event);
  }
}
