import {Injectable} from '@angular/core';

import * as GUI from 'babylonjs-gui';
import { Annotation } from 'src/app/interfaces/annotation/annotation';
import { ANNOTATIONS } from 'src/assets/exampleDataAnnotations/mock-annotations';
import { Observable, of } from 'rxjs';
import { DataService } from '../data/data.service';
import {BabylonService} from '../babylon/babylon.service';

/**
 * @author Zoe Schubert
 * @author Jan G. Wieners
 */

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  public annotationPosition = {
    top: 0,
    left: 0
  };

  public annotationIsVisible = false;
  private annotationCounter = 0;

  constructor(private babylonService: BabylonService) {
  }

  public hideAnnotation() {
    this.annotationIsVisible = false;
  }

  private mousePickModel(unit_mesh: any) {

    if (unit_mesh.source !== null) {

      const scene = this.babylonService.getScene();
      const pickResult = scene.pick(scene.pointerX, scene.pointerY,
        null, false, scene.activeCamera);

      if (pickResult.pickedMesh) {
        this.createAnnotation(pickResult);
      }
    }
  }

  public pickableModel(name: string, pickable: boolean) {

    const mesh = this.babylonService.getScene().getMeshByName(name);

    if (mesh !== null) {

      if (pickable) {

        const that = this;

        mesh.actionManager = new BABYLON.ActionManager(this.babylonService.getScene());

        mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnDoublePickTrigger, function (evt) {
            that.mousePickModel(evt);
          }));
      } else {

        if (mesh.actionManager.hasPickTriggers) {
          for (let i = mesh.actionManager.actions.length - 1; i >= 0; i--) {
            mesh.actionManager.actions.splice(i, 1);
          }
        }
      }
    }
  }

  private createAnnotation(pickResult) {

    const pickResultVector = new BABYLON.Vector3(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);

    this.createAnnotationLabel(pickResultVector, pickResult.getNormal(true, true));
    this.createAnnotationCard(pickResult, pickResultVector);

    this.annotationIsVisible = true;
  }

  private createAnnotationLabel(position: BABYLON.Vector3, normal: BABYLON.Vector3) {

    this.annotationCounter++;

    // two Labels: one is for isOccluded true, one for false -> alpha 0.5 for transparancy
    this.createGeometryForLabel('plane', 'label', true, 1, 0, position, normal);
    this.createGeometryForLabel('planeup', 'labelup', true, 0.5, 1, position, normal);
  }

  private createAnnotationCard(pickResult, pickResultVector: BABYLON.Vector3) {

    const activeCamera = this.babylonService.getScene().activeCamera;
    const engine = this.babylonService.getEngine();

    const p = BABYLON.Vector3.Project(pickResultVector, pickResult.pickedMesh.getWorldMatrix(),
      activeCamera.getViewMatrix().multiply(activeCamera.getProjectionMatrix()),
      activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));

    this.annotationPosition.left = Math.round(p.x);
    this.annotationPosition.top = Math.round(p.y);
  }

  private createGeometryForLabel(namePlane: string, nameLabel: string, clickable: boolean,
                                 alpha: number, renderingGroup: number, position: BABYLON.Vector3,
                                 normal: BABYLON.Vector3) {

    const plane = BABYLON.MeshBuilder.CreatePlane(namePlane + '_' + String(this.annotationCounter),
      {height: 1, width: 1}, this.babylonService.getScene());

    BABYLON.Tags.AddTagsTo(plane, namePlane);

    plane.position = new BABYLON.Vector3(position.x, position.y, position.z);
    plane.translate(normal, 1, BABYLON.Space.WORLD);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const advancedTexturePlane = GUI.AdvancedDynamicTexture.CreateForMesh(plane);

    const label = new GUI.Ellipse(nameLabel + '_' + String(this.annotationCounter));
    label.width = '100%';
    label.height = '100%';
    label.color = 'White';
    label.thickness = 1;
    label.background = 'black';
    label.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;

    advancedTexturePlane.addControl(label);

    if (clickable) {

      const that = this;
      const id = this.annotationCounter;

      label.onPointerDownObservable.add(function () {
        that.onMarkerClicked(id);
      });
    }

    const number = new GUI.TextBlock();
    number.text = String(this.annotationCounter);
    number.color = 'white';
    number.fontSize = 1000;

    label.addControl(number);

    plane.material.alpha = alpha;
    // TODO: click is not working if renderingGroup == 1 and Object is behind another object
    plane.renderingGroupId = renderingGroup;
  }

  private onMarkerClicked(id) {
    console.log(id);
  }

  public updateScreenPosition() {
  }

  getAnnotations(): Observable<Annotation[]> {
    return of(ANNOTATIONS);
  }
/*  createExampleData() {
    const annotations = [

      {
        model: 'example', id: 11, sequence: 1, positionx: 1, positiony: 1, babylonVectorx: 1, babylonVectory: 1, babylonVectorz: 1,
        validated: true, title: 'Interesting Annotation',
        description: 'Here you can write interesting or uninteresting things about your annotation.',
        person: 'x', date: 1, preview: './assets/exampleDataAnnotations/images/anno1.png'
      },
      {
        model: 'example', id: 12, sequence: 2, positionx: 1, positiony: 1, babylonVectorx: 1, babylonVectory: 1, babylonVectorz: 1,
        validated: true, title: 'Interesting Annotation',
        description: 'Here you can write interesting or uninteresting things about your annotation.',
        person: 'x', date: 1, preview: './assets/exampleDataAnnotations/images/anno1.png'
      },
      {
        model: 'example', id: 13, sequence: 3, positionx: 1, positiony: 1, babylonVectorx: 1, babylonVectory: 1, babylonVectorz: 1,
        validated: true, title: 'Interesting Annotation',
        description: 'Here you can write interesting or uninteresting things about your annotation.',
        person: 'x', date: 1, preview: './assets/exampleDataAnnotations/images/anno1.png'
      },
      {
        model: 'example', id: 14, sequence: 4, positionx: 1, positiony: 1, babylonVectorx: 1, babylonVectory: 1, babylonVectorz: 1,
        validated: true, title: 'Interesting Annotation',
        description: 'Here you can write interesting or uninteresting things about your annotation.',
        person: 'x', date: 1, preview: './assets/exampleDataAnnotations/images/anno1.png'
      }
    ];
    return {annotations};
  }*/

}
