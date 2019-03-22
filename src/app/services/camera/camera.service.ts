import {Injectable} from '@angular/core';
import * as BABYLON from 'babylonjs';

import {BabylonService} from '../babylon/babylon.service';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  private canvas: HTMLCanvasElement;
  private scene: BABYLON.Scene;

  public arcRotateCamera: BABYLON.ArcRotateCamera;
  // private universalCamera: BABYLON.UniversalCamera;
  private vrCamera: BABYLON.VRDeviceOrientationFreeCamera | BABYLON.VRDeviceOrientationArcRotateCamera;

  private vrHelper;

  // Parameters (initial Position): alpha, beta, radius,
  public alpha: number;
  public beta: number;
  public radius: number;

  /*
  private x: 0;
  private y: 0;
  private z: 10;

  private xRot: number;
  private yRot: number;*/

  constructor(
    private babylonService: BabylonService) {

    this.babylonService.CanvasObservable.subscribe((newCanvas) => {

      if (newCanvas) {

        this.scene = this.babylonService.getScene();
        this.canvas = newCanvas;

        // Arc Rotate Camera
        // Parameters (initial Position): alpha, beta, radius, target position, scene
        this.arcRotateCamera = this.babylonService.createArcRotateCam(0, 10, 100);
        this.arcRotateCamera.allowUpsideDown = false;
        this.arcRotateCamera.panningSensibility = 25;
        this.arcRotateCamera.keysUp.push(87);
        this.arcRotateCamera.keysDown.push(83);
        this.arcRotateCamera.keysLeft.push(65);
        this.arcRotateCamera.keysRight.push(68);

        this.arcRotateCamera.attachControl(newCanvas, false);

              /*
        this.universalCamera = new BABYLON.UniversalCamera('universalCamera',
          new BABYLON.Vector3(this.x, this.y, this.z), this.scene);

        this.universalSettings();

        this.xRot = this.universalCamera.rotation.x;
        this.yRot = this.universalCamera.rotation.y;
*/
      }
    });
  }

  // VR BUTTON
  public createVrHelperInCamera(): void {
    this.vrHelper = this.babylonService.createVRHelper();
    this.babylonService.getVRHelper().enterVR();
  }

  /*
  public setCamArcRotate(): void {
    if (!this.scene.activeCamera) return;
    if (this.scene.activeCamera.getClassName() !== 'ArcRotateCamera') {

      this.setCameraActive(this.arcRotateCamera);
      this.arcRotateSettings();
    }
  }

  public setCamUniversal(): void {
    if (!this.scene.activeCamera) return;
    if (this.scene.activeCamera.getClassName() !== 'UniversalCamera') {

      this.setCameraActive(this.universalCamera);
      this.universalSettings();
    }
  }*/

  public backToDefault(): void {
    const positionVector = new BABYLON.Vector3(this.alpha, this.beta, this.radius);
    this.moveCameraToTarget(positionVector);
  }

  public setDefaultPosition(alpha: number, beta: number, radius: number) {
    console.log('SET DEFAULT:', alpha, beta, radius);
    this.alpha = alpha;
    this.beta = beta;
    this.radius = radius;
  }

  public setUpperRadiusLimit(radius: number) {
    if (this.arcRotateCamera) {
      this.arcRotateCamera.upperRadiusLimit = radius;
    }
  }


  /*
   private setCameraDefaults(camera: any): void {

     camera.keysUp.push(87);
     camera.keysDown.push(83);
     camera.keysLeft.push(65);
     camera.keysRight.push(68);
     camera.setTarget(BABYLON.Vector3.Zero());
   }


   private setCameraActive(newActiveCamera: any): void {
     if (!this.scene.activeCamera) { return; }
     this.scene.activeCamera.detachControl(this.canvas);
     this.scene.activeCamera = newActiveCamera;
     newActiveCamera.attachControl(this.canvas, false);
   }

   private arcRotateSettings(): void {

     this.arcRotateCamera.panningSensibility = 25;
     this.arcRotateCamera.upperRadiusLimit = 500;
     this.setCameraDefaults(this.arcRotateCamera);
     this.canvas.focus();
   }


   private universalSettings(): void {

     this.universalCamera.position.x = this.x;
     this.universalCamera.position.y = this.y;
     this.universalCamera.position.z = this.z;
     this.universalCamera.ellipsoid = new BABYLON.Vector3(10, 10, 10);
     this.universalCamera.checkCollisions = true;
     this.setCameraDefaults(this.universalCamera);
     this.canvas.focus();
   }

  private setCamArcRotateDefault() {

    this.scene.activeCamera = this.arcRotateCamera;
    this.arcRotateCamera.attachControl(this.canvas, false);

    const name = 'animCam',
      frames = 30;

    const animCamAlpha = new BABYLON.Animation(name, 'alpha', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamAlpha.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.alpha
      }, {
        frame: 30,
        value: this.alpha
      }
    ]);
    this.arcRotateCamera.animations.push(animCamAlpha);

    const animCamBeta = new BABYLON.Animation(name, 'beta', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamBeta.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.beta
      }, {
        frame: 30,
        value: this.beta
      }]);
    this.arcRotateCamera.animations.push(animCamBeta);

    const animCamRadius = new BABYLON.Animation(name, 'radius', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamRadius.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.radius
      }, {
        frame: 30,
        value: this.radius
      }]);
    this.arcRotateCamera.animations.push(animCamRadius);

    this.arcRotateCamera.setTarget(BABYLON.Vector3.Zero());

    this.scene.beginAnimation(this.arcRotateCamera, 0, 30, false, 1, function () {
    });
  }


  private setCamUniversalDefault() {

    const setBackAnm = new BABYLON.Animation('animCam', 'position', 30,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);

    const setBackRotXAnm = new BABYLON.Animation('animCam', 'rotation.x', 30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    const setBackRotYAnm = new BABYLON.Animation('animCam', 'rotation.y', 30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    setBackAnm.setKeys([{
      frame: 0,
      value: new BABYLON.Vector3(this.universalCamera.position.x, this.universalCamera.position.y, this.universalCamera.position.z)
    }, {
      frame: 30,
      value: new BABYLON.Vector3(this.x, this.y, this.z)
    }]);
    setBackRotXAnm.setKeys([{
      frame: 15,
      value: this.universalCamera.rotation.x
    }, {
      frame: 30,
      value: this.xRot
    }]);
    setBackRotYAnm.setKeys([{
      frame: 15,
      value: this.universalCamera.rotation.y
    }, {
      frame: 30,
      value: this.yRot
    }]);

    this.universalCamera.animations.push(setBackAnm);
    this.universalCamera.animations.push(setBackRotXAnm);
    this.universalCamera.animations.push(setBackRotYAnm);

    this.scene.beginAnimation(this.universalCamera, 0, 30, false, 1, function () {
    });
  }*/

  public moveCameraToTarget(positionVector: BABYLON.Vector3) {
    console.log('CAM STARTS:', this.arcRotateCamera.alpha, this.arcRotateCamera.beta, this.arcRotateCamera.radius);

console.log('MOVE CAM TO:', positionVector);

    const name = 'animCam',
      frames = 30;

    const animCamAlpha = new BABYLON.Animation(name, 'alpha', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamAlpha.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.alpha
      }, {
        frame: 30,
        value: positionVector.x
      }
    ]);
    this.arcRotateCamera.animations.push(animCamAlpha);

    const animCamBeta = new BABYLON.Animation(name, 'beta', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamBeta.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.beta
      }, {
        frame: 30,
        value: positionVector.y
      }]);
    this.arcRotateCamera.animations.push(animCamBeta);

    const animCamRadius = new BABYLON.Animation(name, 'radius', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamRadius.setKeys([
      {
        frame: 0,
        value: this.arcRotateCamera.radius
      }, {
        frame: 30,
        value: positionVector.z
      }]);
    this.arcRotateCamera.animations.push(animCamRadius);



    this.scene.beginAnimation(this.arcRotateCamera, 0, 30, false, 1, function () {
    });

  }

  public moveVRCameraToTarget(positionVector: BABYLON.Vector3) {

    if (!this.scene.activeCamera) {
      return;
    }

    // ANIMATION
    const name = 'animCam',
      frames = 30;

    const animCamAlpha = new BABYLON.Animation(name, 'position.x', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamAlpha.setKeys([
      {
        frame: 0,
        value: this.scene.activeCamera.position.x
      }, {
        frame: 30,
        value: positionVector.x - 15
      }
    ]);
    this.scene.activeCamera.animations.push(animCamAlpha);

    const animCamBeta = new BABYLON.Animation(name, 'position.y', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamBeta.setKeys([
      {
        frame: 0,
        value: this.scene.activeCamera.position.y
      }, {
        frame: 30,
        value: positionVector.y + 15
      }]);
    this.scene.activeCamera.animations.push(animCamBeta);

    const animCamRadius = new BABYLON.Animation(name, 'position.z', frames,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    animCamRadius.setKeys([
      {
        frame: 0,
        value: this.scene.activeCamera.position.z
      }, {
        frame: 30,
        value: positionVector.z - 15
      }]);
    this.scene.activeCamera.animations.push(animCamRadius);

    this.scene.beginAnimation(this.scene.activeCamera, 0, 30, false, 1, function () {
    }).onAnimationEndObservable.add(() => {

      // FOR VR-HUD
      // console.log("Active-Camera - 0 Sek After Animation");
      // console.log(this.scene.activeCamera.position);
      this.babylonService.vrJump = true;
    });
  }

  public getActualCameraPosAnnotation() {
    // 11/02/19
    const cameraPosition = {
      x: this.arcRotateCamera.alpha,
      y: this.arcRotateCamera.beta,
      z: this.arcRotateCamera.radius
    };
    // const cameraPosition = [{dimension: 'x', value: this.arcRotateCamera.alpha},
    //   {dimension: 'y', value: this.arcRotateCamera.beta},
    //   {dimension: 'z', value: this.arcRotateCamera.radius}];
    return cameraPosition;
  }

  public getActualCameraPosInitialView() {
    return {
      cameraType: 'arcRotateCam',
      position: {
        x: this.arcRotateCamera.alpha,
        y: this.arcRotateCamera.beta,
        z: this.arcRotateCamera.radius
      }
    };
  }

}
