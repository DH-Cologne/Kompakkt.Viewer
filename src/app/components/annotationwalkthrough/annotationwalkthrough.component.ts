import {Component, OnInit} from '@angular/core';
import {Vector3} from 'babylonjs';

import {AnnotationService} from '../../services/annotation/annotation.service';
import {AnnotationmarkerService} from '../../services/annotationmarker/annotationmarker.service';
import {CameraService} from '../../services/camera/camera.service';
import {BabylonService} from '../../services/babylon/babylon.service';

@Component({
  selector: 'app-annotationwalkthrough',
  templateUrl: './annotationwalkthrough.component.html',
  styleUrls: ['./annotationwalkthrough.component.scss'],
})
export class AnnotationwalkthroughComponent implements OnInit {

  public title: string;
  private positionVector: Vector3;
  private actualRanking: number;

  constructor(private cameraService: CameraService,
              public annotationService: AnnotationService,
              private annotationmarkerService: AnnotationmarkerService,
              private babylonService: BabylonService) {

    this.positionVector = Vector3.Zero();
    this.actualRanking = 0;
    this.title = 'Annotation Walkthrough';
  }

  public previousAnnotation() {

    const annotations = this.annotationService.annotations;

    if (annotations.length) {

      if (this.actualRanking === 0) {
        this.actualRanking = annotations.length;
      } else {
        this.actualRanking = this.actualRanking - 1;
      }
    }

    if (this.actualRanking < 0) {
      this.actualRanking = 0;
    }

    if (this.actualRanking > annotations.length) {
      this.actualRanking = annotations.length;
    }
    this.getAction(this.actualRanking);
  }

  public nextAnnotation() {

    const annotations = this.annotationService.annotations;

    if (annotations.length) {

      if (this.actualRanking > annotations.length - 1) {
        this.actualRanking = annotations.length - 1;
      } else {
        this.actualRanking = this.actualRanking + 1;
      }
      if (this.actualRanking === annotations.length) {
        this.actualRanking = 0;
      }
    } else {
      this.actualRanking = 0;
    }
    if (this.actualRanking < 1) {
      this.actualRanking = 0;
    }
    if (this.actualRanking > annotations.length) {
      this.actualRanking = 0;
    }
    this.getAction(this.actualRanking);
  }

  private getAction(index: number) {

    const annotations = this.annotationService.annotations;

    const test = annotations[index];
    const test2 = annotations.length;

    console.log('annotation an der Stelle ' + index + ' ist ' + test + 'Array länge ' + test2);

    if (annotations.length) {

            this.title = annotations[index].body.content.title;
            const cameraVector = new Vector3(
              annotations[index].body.content.relatedPerspective.vector.x,
              annotations[index].body.content.relatedPerspective.vector.y,
              annotations[index].body.content.relatedPerspective.vector.z);
            this.cameraService.moveCameraToTarget(cameraVector);
            this.annotationmarkerService.toggleCreatorPopup(annotations[index]._id);
            this.babylonService.hideMesh(annotations[index]._id, true);
    } else {
      this.actualRanking = 0;
    }
  }

  ngOnInit() {
  }

}
