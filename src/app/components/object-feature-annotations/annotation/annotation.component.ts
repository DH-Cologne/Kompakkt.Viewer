import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import { MatDialog } from '@angular/material';
import { Matrix, Vector3 } from 'babylonjs';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

import { IAnnotation } from '../../../interfaces/interfaces';
import { AnnotationService } from '../../../services/annotation/annotation.service';
import { AnnotationmarkerService } from '../../../services/annotationmarker/annotationmarker.service';
import { BabylonService } from '../../../services/babylon/babylon.service';
import { ProcessingService } from '../../../services/processing/processing.service';
import { SocketService } from '../../../services/socket/socket.service';
import { UserdataService } from '../../../services/userdata/userdata.service';
import { DialogAnnotationEditorComponent } from '../../dialogs/dialog-annotation-editor/dialog-annotation-editor.component';

@Component({
  selector: 'app-annotation',
  templateUrl: './annotation.component.html',
  styleUrls: ['./annotation.component.scss'],
})
export class AnnotationComponent implements OnInit {
  @Input() entityFileName: string | undefined;
  @Input() annotation: IAnnotation | undefined;

  @ViewChild('annotationContent', { static: false }) private annotationContent;

  // internal
  public isEditMode = false;
  public showAnnotation = false;
  public positionTop = 0;
  public positionLeft = 0;
  public cardWidth = this.el.nativeElement.offsetWidth;
  public cardHeight = this.el.nativeElement.offsetHeight;
  public collapsed = false;
  public selectedAnnotation: string | undefined;
  // --- JAN ----
  public showMediaBrowser = false;
  public config: PerfectScrollbarConfigInterface = {};
  // ---

  // external
  public visibility = false;
  public isAnnotatingAllowed = false;
  public isAnnotationOwner = false;
  public isCollectionOwner = false;
  public isInSocket = false;

  constructor(
    public annotationService: AnnotationService,
    public babylonService: BabylonService,
    public annotationmarkerService: AnnotationmarkerService,
    public socketService: SocketService,
    public dialog: MatDialog,
    private userdataService: UserdataService,
    private processingService: ProcessingService,
    private el: ElementRef,
  ) {}

  ngOnInit() {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    this.showAnnotation = true;
    this.collapsed = false;
    this.isAnnotatingAllowed = this.annotationService.isAnnotatingAllowed;
    this.isAnnotationOwner = this.userdataService.isAnnotationOwner(
      this.annotation,
    );
    this.isCollectionOwner = this.userdataService.isCollectionOwner;

    this.processingService.loggedIn.subscribe(_ => {
      if (!this.annotation) {
        console.error('AnnotationComponent without annotation', this);
        throw new Error('AnnotationComponent without annotation');
        return;
      }
      this.isAnnotationOwner = this.userdataService.isAnnotationOwner(
        this.annotation,
      );
    });

    this.userdataService.collectionOwner.subscribe(colOwner => {
      this.isCollectionOwner = colOwner;
    });

    this.annotationService.isSelectedAnnotation.subscribe(selectedAnno => {
      if (!this.annotation) {
        console.error('AnnotationComponent without annotation', this);
        throw new Error('AnnotationComponent without annotation');
        return;
      }
      selectedAnno === this.annotation._id
        ? (this.visibility = true)
        : (this.visibility = false);
      this.selectedAnnotation = selectedAnno;
    });

    this.annotationService.annnotatingAllowed.subscribe(allowed => {
      this.isAnnotatingAllowed = allowed;
    });

    this.socketService.inSocket.subscribe(inSocket => {
      this.isInSocket = inSocket;
    });

    this.annotationService.isEditModeAnnotation.subscribe(selectedEditAnno => {
      if (!this.annotation) {
        console.error('AnnotationComponent without annotation', this);
        throw new Error('AnnotationComponent without annotation');
        return;
      }
      const isEditAnno = selectedEditAnno === this.annotation._id;
      if (!isEditAnno && this.isEditMode) {
        this.isEditMode = false;
        this.annotationService.updateAnnotation(this.annotation);
        console.log(this.isEditMode);
      }
      if (isEditAnno && !this.isEditMode) {
        this.isEditMode = true;
        console.log(this.isEditMode);
        console.log(this.isAnnotatingAllowed);

        // this.annotationService.setSelectedAnnotation(this.annotation._id);
      }
    });

    setInterval(() => {
      if (!this.annotation) {
        console.error('AnnotationComponent without annotation', this);
        throw new Error('AnnotationComponent without annotation');
        return;
      }
      this.setPosition(this.annotation);
    }, 15);
  }

  public closeAnnotation(): void {
    this.annotationService.setSelectedAnnotation('');
  }

  public toggleEditViewMode(): void {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    this.isEditMode
      ? this.annotationService.setEditModeAnnotation('')
      : this.annotationService.setEditModeAnnotation(this.annotation._id);
  }

  public shareAnnotation() {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    this.annotationService.shareAnnotation(this.annotation);
  }

  public deleteAnnotation(): void {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    this.annotationService.deleteAnnotation(this.annotation);
  }

  private setPosition(annotation: IAnnotation) {
    const scene = this.babylonService.getScene();

    if (!scene) {
      return false;
    }

    const getMesh = scene.getMeshByName(annotation._id + '_pick');

    if (getMesh && scene.activeCamera) {
      const engine = this.babylonService.getEngine();

      const [width, height] = [
        engine.getRenderWidth(),
        engine.getRenderHeight(),
      ];

      const p = Vector3.Project(
        getMesh.getBoundingInfo().boundingBox.centerWorld,
        Matrix.Identity(),
        scene.getTransformMatrix(),
        scene.activeCamera.viewport.toGlobal(width, height),
      );

      const [left, top] = [Math.round(p.x), Math.round(p.y)];

      // TODO: get actual card width and height from component
      // console.log('height---' + this.el.nativeElement.offsetHeight);
      this.positionTop =
        top < 0
          ? 0
          : top + this.cardHeight > height
          ? height - this.cardHeight
          : top;
      this.positionLeft =
        left < 0
          ? 0
          : left + this.cardWidth > width
          ? width - this.cardWidth
          : left;
    }
  }

  // --- JAN ----
  public editFullscreen(): void {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    const dialogRef = this.dialog.open(DialogAnnotationEditorComponent, {
      width: '75%',
      data: {
        title: this.annotation.body.content.title,
        content: this.annotation.body.content.description,
      },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.annotation) {
        this.annotation.body.content.title = result.title;
        this.annotation.body.content.description = result.content;
      }
      console.log(result);
    });
  }

  public addMedium(medium) {
    if (!this.annotation) {
      console.error('AnnotationComponent without annotation', this);
      throw new Error('AnnotationComponent without annotation');
      return;
    }
    const mdImage = `![alt ${medium.description}](${medium.url})`;

    this.annotationContent.nativeElement.focus();

    const start = this.annotationContent.nativeElement.selectionStart;
    const value = this.annotationContent.nativeElement.value;

    this.annotation.body.content.description = `${value.substring(
      0,
      start,
    )}${mdImage}${value.substring(start, value.length)}`;
  }

  // ---
}
