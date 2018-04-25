import {Component, OnInit} from '@angular/core';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import {BabylonService} from '../../services/engine/babylon.service';
import {CameraService} from '../../services/camera/camera.service';
import {ImportService} from '../../services/import/import.service';


@Component({
  selector: 'app-annotations',
  templateUrl: './annotations.component.html',
  styleUrls: ['./annotations.component.css']
})
export class AnnotationsComponent implements OnInit {

  private canvas: HTMLCanvasElement;
  private scene: BABYLON.Scene;
  private mesh: BABYLON.Mesh;
  private annotationCounter: number;


  constructor(
    private cameraService: CameraService,
    private babylonService: BabylonService,
    private importService: ImportService
  ) {
  }

  public createAnnotations(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {

    this.scene = scene;
    this.canvas = canvas;
    this.annotationCounter = 0;

    // TODO Please refactor me, I'm as ugly as a german folk musician!!!11!!!1!
    const that = this;

    // Action -> Bei Doppelklick auf ein Modell
    const mousePickModel = function (unit_mesh: any) {
      if (unit_mesh.source !== null) {
        const pickResult = scene.pick(scene.pointerX, scene.pointerY, null, false, this.camera);
        if (pickResult.pickedMesh) {
          const pickResultVector = new BABYLON.Vector3(pickResult.pickedPoint.x, pickResult.pickedPoint.y, pickResult.pickedPoint.z);
          const normal = pickResult.getNormal(true, true);
          // TODO Please refactor me, please!
          that.createAnnotationLabel(pickResultVector, normal);
        }
      }
    };

    // TODO hier würde ich gerne auf unser Modell zugreifen
    // this.scene.getMeshByName('Texture_0');
    // beim importieren erreichbar über newMeshes[0];
    this.mesh = BABYLON.Mesh.CreateBox('box1', 4, this.scene);
    // Doppelklick auf Modell, bekommt eine Funktion
    const action = new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnDoublePickTrigger, mousePickModel);
    this.mesh.actionManager = new BABYLON.ActionManager(this.scene);
    this.mesh.actionManager.registerAction(action);

  }

  ngOnInit() {
  }

  public createAnnotationLabel(position: BABYLON.Vector3, normal: BABYLON.Vector3) {
    this.annotationCounter++;

    // two Labels: one is for isOccluded true, one for false -> alpha 0.5 for transparancy
    this.createGeometryForLabel('plane', 'label', true, 1, 0, position, normal);
    this.createGeometryForLabel('planeup', 'labelup', true, 0.5, 1, position, normal);
  }

  private createGeometryForLabel
  (
    namePlane: string,
    nameLabel: string,
    clickable: boolean,
    alpha: number,
    renderingGroup: number,
    position: BABYLON.Vector3,
    normal: BABYLON.Vector3
  ) {
    const plane = BABYLON.MeshBuilder.CreatePlane
    (
      namePlane + '_' + String(this.annotationCounter),
      {height: 1, width: 1},
      this.scene
    );
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

    if (clickable === true) {
      label.onPointerDownObservable.add(function () {
        // Kameraposition einnehmen
        // HTML Textbox anzeigen
        alert('works');
        //that.updateScreenPosition();
        /*
      *
      * Dann kann diese auch onclick leuchten
      * Dafür die 3D engine in Scene so laden:
      * this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });
      * Add the highlight layer.
      * var hl = new BABYLON.HighlightLayer("hl1", scene);
      * hl.addMesh(plane, BABYLON.Color3.Green());
      * hl.removeMesh(plane);
      */

      });
    }

    const number = new GUI.TextBlock();
    number.text = String(this.annotationCounter);
    number.color = 'white';
    number.fontSize = 1000;
    number.width = '2000px';
    number.height = '2000px';

    label.addControl(number);

    plane.material.alpha = alpha;
    //TODO: click is not working if renderingGroup = 1 and Object is behind another object
    plane.renderingGroupId = renderingGroup;
  }


// Onklick
// Position einnehmen (erstmal perfekte Sicht auf die Annotation)
// HTML Box anzeigen (visible)
// Bei Interaktion HTML Box ausblenden if camera move (unvisible)

  private updateScreenPosition() {

    const annotation = <HTMLElement>document.querySelector('.annotation');
    const vector = this.scene.getMeshByName('plane_1').getBoundingInfo().boundingBox.centerWorld;

    vector.x = Math.round((0.5 + vector.x / 2) * (this.canvas.width / window.devicePixelRatio));
    vector.y = Math.round((0.5 - vector.y / 2) * (this.canvas.height / window.devicePixelRatio));

    annotation.style.top = vector.y + 'px';
    annotation.style.left = vector.x + 'px';

  }

// Delete Annotation
}
