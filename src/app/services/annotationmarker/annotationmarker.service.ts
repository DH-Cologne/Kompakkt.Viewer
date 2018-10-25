import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import {BabylonService} from '../babylon/babylon.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {Observable} from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class AnnotationmarkerService {


  public open_popup = '';
  private isOpen: BehaviorSubject<string> = new BehaviorSubject('');

  public toggleCreatorPopup(id: string) {
    this.open_popup = id;
    this.isOpen.next(this.open_popup);
  }

  popupIsOpen(): Observable<any> {
    return this.isOpen.asObservable();
  }


  constructor(private babylonService: BabylonService) {

  }

  // Ein und Ausblenden des Markers
  // Zahl verändern/ aktualisieren

  public createAnnotationMarker(annotation) {

    const positionVector = new BABYLON.Vector3(annotation.referencePoint[0].value,
      annotation.referencePoint[1].value, annotation.referencePoint[2].value);
    const normalVector = new BABYLON.Vector3(annotation.referencePointNormal[0].value,
      annotation.referencePointNormal[1].value, annotation.referencePointNormal[2].value);

    // two Labels: one is for isOccluded true, one for false -> alpha 0.5 for transparancy

    const plane1 = this.createPlane(annotation._id + '_pick', 1, 1, annotation._id, positionVector, normalVector);
    const label1 = this.createClickLabel(annotation._id, '100%', '100%', annotation._id, 'White', 'black');

    GUI.AdvancedDynamicTexture.CreateForMesh(plane1).addControl(label1);
    label1.addControl(this.createRankingNumber(annotation._id, annotation.ranking));
    plane1.material.alpha = 1;
    plane1.renderingGroupId = 0;

    const plane2 = this.createPlane(annotation._id + '_pick', 1, 1, annotation._id, positionVector, normalVector);
    const label2 = this.createClickLabel(annotation._id, '100%', '100%', annotation._id, 'White', 'black');

    GUI.AdvancedDynamicTexture.CreateForMesh(plane2).addControl(label2);
    label2.addControl(this.createRankingNumber(annotation._id, annotation.ranking));
    plane2.material.alpha = 0.5;
    // TODO: click is not working if renderingGroup == 1 and Object is behind another object
    plane2.renderingGroupId = 1;
  }

  private createPlane(name: string, height: number, width: number, tag: string, position: BABYLON.Vector3, normal: BABYLON.Vector3) {
    const plane = BABYLON.MeshBuilder.CreatePlane(name,
      {height: height, width: width}, this.babylonService.getScene());
    BABYLON.Tags.AddTagsTo(plane, tag + ' plane');
    plane.position = position;
    plane.translate(normal, 1, BABYLON.Space.WORLD);
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    return plane;
  }

  private createClickLabel(name: string, height: string, width: string, tag: string, color: string, backgroundColor: string) {

    const label = new GUI.Ellipse(name);
    label.width = width;
    label.height = height;
    label.color = color;
    label.thickness = 1;
    label.background = backgroundColor;
    label.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    BABYLON.Tags.AddTagsTo(label, tag + ' label');

    const that = this;
    const id = name;

    label.onPointerDownObservable.add(function () {
      that.onMarkerClicked(id);
    });
    return label;

  }

  private onMarkerClicked(id) {
    console.log(id);
    this.toggleCreatorPopup(id);

  }

  public createRankingNumber(annotationID: string, rankingNumber: string) {
    const number = new GUI.TextBlock();
    number.text = rankingNumber;
    number.color = 'white';
    number.fontSize = 1000;
    BABYLON.Tags.AddTagsTo(number, annotationID + ' number');

    return number;
  }

  public setRankingNumber() {

    //need to redraw -> delete and create
    // http://playground.babylonjs.com/#HETZDX#4
    /*
    const label = this.babylonService.getScene().getMeshesByTags(annotationID && 'plane');
    label.forEach(function (value) {
      label.updateText(rankingNumber);
    });*/
  }

  public visabilityMarker(annotationID: string, visability: boolean) {
    const marker = this.babylonService.getScene().getMeshesByTags(annotationID);
    marker.forEach(function (value) {
      value.isVisible = visability;
    });
  }

  public deleteMarker(annotationID: string) {
    const marker = this.babylonService.getScene().getMeshesByTags(annotationID);
    console.log(annotationID);
    console.log(this.babylonService.getScene().getMeshesByTags(annotationID));
    console.log(marker);
    marker.forEach(function (value) {
      value.dispose();
    });
  }

}