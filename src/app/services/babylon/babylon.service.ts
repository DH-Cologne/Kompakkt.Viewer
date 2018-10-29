import {Injectable} from '@angular/core';

import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

@Injectable({
  providedIn: 'root'
})
export class BabylonService {

  constructor() {
  }

  private scene: BABYLON.Scene;
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;

  public bootstrap(canvas: HTMLCanvasElement, antialiasing: boolean): void {

    this.canvas = canvas;
    this.engine = new BABYLON.Engine(canvas, antialiasing, {preserveDrawingBuffer: true, stencil: true});
    this.scene = new BABYLON.Scene(this.engine);
  }

  public resize(): void {

    this.engine.resize();
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  public getEngine(): BABYLON.Engine {
    return this.engine;
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public setClearColor(r: number, g: number, b: number, a: number): void {
    this.scene.clearColor = new BABYLON.Color4(r, g, b, a);
  }

  public createHemisphericLight(name: string, position: any): BABYLON.HemisphericLight {
    return new BABYLON.HemisphericLight(name, new BABYLON.Vector3(position.x, position.y, position.z), this.scene);
  }

  public createArcRotateCam(name: string, alpha: number, beta: number, radius: number, position: any): BABYLON.ArcRotateCamera {
    return new BABYLON.ArcRotateCamera(name, alpha, beta, radius, new BABYLON.Vector3(position.x, position.y, position.z), this.scene);
  }

  public setBackgroundImage(imgUrl: string): void {

    const background = new BABYLON.Layer('background', imgUrl, this.scene, true);
    background.isBackground = true;
  }

  public loadModel(rootUrl: string, filename: string): Promise<any> {

    const engine = this.engine;

    return new Promise<any>((resolve, reject) => {

      BABYLON.SceneLoader.ImportMeshAsync(null, rootUrl, filename, this.scene, function (progress) {

        if (progress.lengthComputable) {
          engine.loadingUIText = 'Loading, please wait...' + (progress.loaded * 100 / progress.total).toFixed() + '%';
        } else {

          const dlCount = progress.loaded / (1024 * 1024);
          engine.loadingUIText = 'Loading, please wait...' + Math.floor(dlCount * 100.0) / 100.0 + ' MB already loaded.';
        }

        engine.loadingUIText = 'Loaded ' + progress.loaded + ' / ';
      }).then(function (result) {
        resolve(result);
      }, function (error) {
        reject(error);
      });
    });
  }

  public saveScene(): void {
    return BABYLON.SceneSerializer.Serialize(this.scene);
  }

  public createScreenshot(): void {
    BABYLON.Tools.CreateScreenshot(this.getEngine(), this.getScene().activeCamera, {precision: 2});
  }

  public createPreviewScreenshot(width) {

    return new Promise<any>((resolve, reject) => {

      BABYLON.Tools.CreateScreenshot(this.getEngine(), this.getScene().activeCamera, width, function (screenshot) {
        resolve(screenshot);
      });
    });
  }
}
