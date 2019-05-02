import {EventEmitter, Injectable, Output} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material';
import {ActionManager} from 'babylonjs';
import * as BABYLON from 'babylonjs';
import {Socket} from 'ngx-socket-io';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';

import {environment} from '../../../environments/environment';
import {DialogGetUserDataComponent} from '../../components/dialogs/dialog-get-user-data/dialog-get-user-data.component';
import {DialogShareAnnotationComponent} from '../../components/dialogs/dialog-share-annotation/dialog-share-annotation.component';
import {IAnnotation, ICompilation, IModel} from '../../interfaces/interfaces';
import {ActionService} from '../action/action.service';
import {AnnotationmarkerService} from '../annotationmarker/annotationmarker.service';
import {BabylonService} from '../babylon/babylon.service';
import {CameraService} from '../camera/camera.service';
import {DataService} from '../data/data.service';
import {MessageService} from '../message/message.service';
import {MongohandlerService} from '../mongohandler/mongohandler.service';
import {OverlayService} from '../overlay/overlay.service';
import {ProcessingService} from '../processing/processing.service';
import {SocketService} from '../socket/socket.service';
import {UserdataService} from '../userdata/userdata.service';

@Injectable({
  providedIn: 'root',
})

export class AnnotationService {

  public isAnnotatingAllowed = false;
  @Output() annnotatingAllowed: EventEmitter<boolean> = new EventEmitter();
  public isCollectionInputSelected: boolean;
  // TODO
  private isOpen = false;
  private isMeshSettingsMode: boolean;
  public inSocket: boolean;
  private isDefaultModelLoaded: boolean;
  private isFallbackModelLoaded: boolean;

  public annotations: IAnnotation[];
  public defaultAnnotationsSorted: IAnnotation[];
  public collectionAnnotationsSorted: IAnnotation[];

  private defaultAnnotations: IAnnotation[];
  private collectionAnnotations: IAnnotation[];
  private unsortedAnnotations: IAnnotation[];
  private pouchDBAnnotations: IAnnotation[];
  private serverAnnotations: IAnnotation[];
  private currentModel: IModel;
  public currentCompilation: ICompilation;
  private actualModelMeshes: BABYLON.Mesh[] = [];

  private isCollection: boolean;

  private isannotationSourceCollection: boolean;
  @Output() annotationSourceCollection: EventEmitter<boolean> = new EventEmitter();

  private selectedAnnotation: BehaviorSubject<string> = new BehaviorSubject('');
  public isSelectedAnnotation = this.selectedAnnotation.asObservable();

  private editModeAnnotation: BehaviorSubject<string> = new BehaviorSubject('');
  public isEditModeAnnotation = this.editModeAnnotation.asObservable();

  constructor(private babylonService: BabylonService,
              private dataService: DataService,
              private actionService: ActionService,
              private annotationmarkerService: AnnotationmarkerService,
              private mongo: MongohandlerService,
              private message: MessageService,
              public socket: Socket,
              private processingService: ProcessingService,
              private cameraService: CameraService,
              private dialog: MatDialog,
              private userdataService: UserdataService,
              private socketService: SocketService,
              private overlayService: OverlayService) {

    this.annotations = [];

    this.socketService.inSocket.subscribe(inSocket => {
      this.inSocket = inSocket;
      if (inSocket) {
        this.annotations = this.socketService.annotationsForSocket;
        this.redrawMarker();
        this.socketService.newAnnotation.subscribe(newAnnotation => {
          this.annotations.push(newAnnotation);
        });
      } else {
        this.annotations = JSON.parse(JSON.stringify(this.isannotationSourceCollection ?
          this.collectionAnnotationsSorted : this.defaultAnnotationsSorted));
        this.redrawMarker();
      }
    });

    this.overlayService.editorSetting.subscribe(meshSettingsMode => {
      this.isMeshSettingsMode = meshSettingsMode;
      this.setAnnotatingAllowance();
    });

    this.overlayService.editor.subscribe(open => {
      this.isOpen = open;
      this.setAnnotatingAllowance();
    });

    this.processingService.Observables.actualModel.subscribe(actualModel => {
      this.currentModel = actualModel;
    });

    this.processingService.fallbackModelLoaded.subscribe(fallback => {
      this.isFallbackModelLoaded = fallback;
    });

    this.processingService.Observables.actualCollection.subscribe(actualCompilation => {
      if (!actualCompilation) return;
      actualCompilation._id ? this.isCollection = true : this.isCollection = false;
      this.currentCompilation = actualCompilation;
    });

    this.processingService.Observables.actualModelMeshes.subscribe(actualModelMeshes => {
      this.actualModelMeshes = actualModelMeshes;
      this.loadAnnotations();
    });

    this.processingService.defaultModelLoaded.subscribe(defaultLoad => {
      this.isDefaultModelLoaded = defaultLoad;
    });

    this.annotationmarkerService.isSelectedAnnotation.subscribe(selectedAnno => {
      this.selectedAnnotation.next(selectedAnno);
    });

  }

  public async loadAnnotations() {

    BABYLON.Tags.AddTagsTo(this.actualModelMeshes, this.currentModel._id);

    // In diesem Array sollten alle Annotationen in der richtigen Reihenfolge liegen,
    // die visuell für das aktuelle
    // Model relevant sind, zu Beginn also erstmal keine
    this.annotations = [];

    // Hier werden die Annotationen unsortiert rein geworfen,
    // wenn sie aus den verschiedenen Quellen geladen und aktualisiert wurden
    // Dieses Array erzeugt keine visuellen Elemente
    this.unsortedAnnotations = [];

    // Annnotationen aus PouchDB
    this.pouchDBAnnotations = [];

    // Annotationen, die auf dem Server gespeichert sind
    this.serverAnnotations = [];

    // Annotationen, die nicht zu einer Collection gehören
    this.defaultAnnotations = [];
    this.defaultAnnotationsSorted = [];

    // Annotationen, die zu einer Collection gehören
    this.collectionAnnotations = [];
    this.collectionAnnotationsSorted = [];

    this.selectedAnnotation.next('');
    this.editModeAnnotation.next('');

    // Alle Marker, die eventuell vom vorherigen Modell noch da sind, sollen gelöscht werden
    await this.annotationmarkerService.deleteAllMarker();
    // Beim Laden eines Modells, werden alle in der PuchDB vorhandenen Annotationen,
    // auf dem Server vorhandenen Anntoatationen geladen
    if (!this.isDefaultModelLoaded) {
      await this.getAnnotationsfromServerDB();
      await this.getAnnotationsfromLocalDB();
      await this.updateLocalDB();
      await this.updateAnnotationList();
      await this.splitDefaultCollection();
      await this.sortAnnotationsDefault();
      await this.sortAnnotationsCollection();
    } else {
      this.defaultAnnotations = [];
      this.defaultAnnotationsSorted.push(this.createDefaultAnnotation());
      this.selectedAnnotation.next(this.defaultAnnotationsSorted[this.defaultAnnotationsSorted.length - 1]._id);
      this.socketService.initialAnnotationsForSocket(this.defaultAnnotationsSorted);
    }
    // Jetzt sollen die Annotationen sortiert werden und in der richtigen Reihenfolge in das Array geschrieben werden
    // Achtung: dann gibt es auch direkt einen visuellen Output durch die Components!
    // Da die Labels erst im nächsten Schritt gezeichnet werden, hängen die Fenster der Annotationen dann kurz ohne Position
    // in der oberen linken Ecke.
    // Die Labels werden gezeichnet und die Fenster haben nun einen Orientierungspunkt

    // Das neu geladene Modell wird annotierbar, ist aber noch nicht klickbar -> das soll erst passieren,
    // wenn der Edit-Mode aufgerufen wird
    this.initializeAnnotationMode();
    this.toggleAnnotationSource(false, true);
  }

  private async getAnnotationsfromServerDB() {
    // Annotationen vom Server des aktuellen Modells...
    if (this.currentModel.annotationList) {
      this.currentModel.annotationList.forEach(annotation => {
        if (annotation && annotation._id) {
          this.serverAnnotations.push(annotation);
        }
      });
    }
    // ...und der aktuellen Compilation (if existing)
    if (this.isCollection && this.currentCompilation.annotationList) {
      this.currentCompilation.annotationList.forEach(annotation => {
        if (annotation && annotation._id) {
          this.serverAnnotations.push(annotation);
        }
      });
    }
    console.log('getAnnotationsfromServerDB', this.serverAnnotations);
  }

  private async getAnnotationsfromLocalDB() {
    // Annotationen aus PouchDB des aktuellen Modells und der aktuellen Compilation (if existing)
    this.pouchDBAnnotations = await this.fetchAnnotations(this.currentModel._id);

    if (this.isCollection) {
      const _compilationAnnotations = await this.fetchAnnotations(this.currentModel._id
        && this.currentCompilation._id);
      this.pouchDBAnnotations = this.pouchDBAnnotations.concat(_compilationAnnotations);
    }
    console.log('getAnnotationsfromLocalDB', this.pouchDBAnnotations);
  }

  private async updateLocalDB() {
    this.serverAnnotations.forEach(annotation => {
      const localAnnotation = this.pouchDBAnnotations
        .find(_localAnnotation => _localAnnotation._id === annotation._id);
      if (!localAnnotation) {
        this.dataService.updateAnnotation(annotation);
        this.pouchDBAnnotations.push(annotation);
      }
    });
    console.log('updateLocalDB', this.pouchDBAnnotations);
  }

  private async updateAnnotationList() {
    // Durch alle Annotationen der lokalen DB
    this.pouchDBAnnotations.forEach(annotation => {
      const isLastModifiedByMe = annotation.lastModifiedBy._id
        === this.userdataService.currentUserData._id;
      const isCreatedByMe = annotation.creator._id
        === this.userdataService.currentUserData._id;

      // Finde die Annotaion in den Server Annotationen
      if (annotation && this.serverAnnotations) {
        const serverAnnotation = this.serverAnnotations
          .find(_serverAnnotation => _serverAnnotation._id === annotation._id);
        // Wenn sie gefunden wurde aktuellere speichern lokal bzw. server

        if (serverAnnotation) {
          if (annotation.lastModificationDate && serverAnnotation.lastModificationDate) {
            // vergleichen welche aktueller ist
            if (annotation.lastModificationDate !== serverAnnotation.lastModificationDate) {

              if (annotation.lastModificationDate < serverAnnotation.lastModificationDate) {
                // Update local DB
                this.dataService.updateAnnotation(serverAnnotation);
                this.pouchDBAnnotations
                  .splice(this.pouchDBAnnotations.indexOf(annotation), 1, serverAnnotation);
                this.unsortedAnnotations.push(serverAnnotation);
              }

              if (serverAnnotation.lastModificationDate < annotation.lastModificationDate) {
                // Update Server
                this.mongo.updateAnnotation(annotation);
                this.serverAnnotations.splice(this.pouchDBAnnotations
                  .indexOf(serverAnnotation), 1, annotation);
                this.unsortedAnnotations.push(annotation);
              }
            } else {
              // Server und LocalDB identisch
              this.unsortedAnnotations.push(annotation);
            }

            // Wenn sie nicht gefunden wurde: Annotation existiert nicht auf dem Server,
            // aber in der Local DB
            // -> wurde gelöscht oder
            // noch nicht gespeichert
          }
        } else {
          // Nicht in Server Annos gefunden
          // Checke, ob local last editor === creator === ich
          if (isLastModifiedByMe && isCreatedByMe) {
            // Annotation auf Server speichern
            // Update Server
            this.mongo.updateAnnotation(annotation);
            this.serverAnnotations.push(annotation);
            this.unsortedAnnotations.push(annotation);
          } else {
            // Nicht local last editor === creator === ich
            // Annotation local löschen
            this.dataService.deleteAnnotation(annotation._id);
            this.pouchDBAnnotations.splice(this.pouchDBAnnotations.indexOf(annotation));
          }

        }
      } else {
        // Nicht in Server Annos gefunden
        // Checke, ob local last editor === creator === ich
        if (isLastModifiedByMe && isCreatedByMe) {
          // Annotation auf Server speichern
          // Update Server
          this.mongo.updateAnnotation(annotation);
          this.serverAnnotations.push(annotation);
          this.unsortedAnnotations.push(annotation);
        } else {
          // Nicht local last editor === creator === ich
          // Annotation local löschen
          this.dataService.deleteAnnotation(annotation._id);
          this.pouchDBAnnotations.splice(this.pouchDBAnnotations.indexOf(annotation));
        }
      }
    });

    console.log('UpdatedAnnotations', this.unsortedAnnotations);
  }

  private async splitDefaultCollection() {
    this.unsortedAnnotations.forEach(annotation => {
      if (annotation._id) {
        if (!annotation.target.source.relatedCompilation ||
          annotation.target.source.relatedCompilation === '') {
          this.defaultAnnotations.push(annotation);
        } else {
          if (this.currentCompilation._id) {
            this.collectionAnnotations.push(annotation);
          }
        }
      }
    });
    console.log('splitDefaultCollection', this.defaultAnnotations, this.collectionAnnotations);
  }

  private async sortAnnotationsDefault() {

    this.defaultAnnotationsSorted = this.defaultAnnotations;
    this.defaultAnnotations = this.defaultAnnotationsSorted.slice(0);
    this.defaultAnnotationsSorted.splice(0, this.defaultAnnotationsSorted.length);
    this.defaultAnnotationsSorted = this.defaultAnnotations.slice(0);

    await this.defaultAnnotationsSorted.sort((leftSide, rightSide): number => {
      if (+leftSide.ranking < +rightSide.ranking) {
        return -1;
      }
      if (+leftSide.ranking > +rightSide.ranking) {
        return 1;
      }
      return 0;
    });

    this.changedRankingPositions(this.defaultAnnotationsSorted);
  }

  private async sortAnnotationsCollection() {

    this.collectionAnnotationsSorted = this.collectionAnnotations;
    this.collectionAnnotations = this.collectionAnnotationsSorted.slice(0);
    this.collectionAnnotationsSorted.splice(0, this.collectionAnnotationsSorted.length);
    this.collectionAnnotationsSorted = this.collectionAnnotations.slice(0);

    await this.collectionAnnotationsSorted.sort((leftSide, rightSide): number => {
      if (+leftSide.ranking < +rightSide.ranking) {
        return -1;
      }
      if (+leftSide.ranking > +rightSide.ranking) {
        return 1;
      }
      return 0;
    });
    await this.changedRankingPositions(this.collectionAnnotationsSorted);
    // TODO move to load function
    this.socketService.initialAnnotationsForSocket(this.collectionAnnotationsSorted);

  }

  // Die Annotationsfunktionalität wird zum aktuellen Modell hinzugefügt
  public initializeAnnotationMode() {
    this.actualModelMeshes.forEach(mesh => {
      this.actionService.createActionManager(mesh, ActionManager.OnDoublePickTrigger, this.createNewAnnotation.bind(this));
    });
    this.annotationMode(false);
  }

  public async createNewAnnotation(result: any) {

    const camera = this.cameraService.getActualCameraPosAnnotation();

    this.babylonService.createPreviewScreenshot(400)
      .then(async detailScreenshot => {
        // TODO: Detect if user is offline
        const generatedId = this.mongo.generateObjectId();
        /* TODO check id from server is needed
        await this.mongo.getUnusedObjectId()
          .then(id => generatedId = id)
          .catch(e => console.error(e));*/

        const personName = this.userdataService.currentUserData.fullname;
        const personID = this.userdataService.currentUserData._id;

        const newAnnotation: IAnnotation = {
          validated: (!this.isCollection),
          _id: generatedId,
          identifier: generatedId,
          ranking: this.annotations.length + 1,
          creator: {
            type: 'person',
            name: personName,
            _id: personID,
          },
          created: new Date().toISOString(),
          generator: {
            type: 'software',
            name: environment.version,
            _id: personID,
            homepage: 'https://github.com/DH-Cologne/Kompakkt',
          },
          motivation: 'defaultMotivation',
          lastModifiedBy: {
            type: 'person',
            name: personName,
            _id: personID,
          },
          body: {
            type: 'annotation',
            content: {
              type: 'text',
              title: '',
              description: '',
              relatedPerspective: {
                cameraType: camera.cameraType,
                position: {
                  x: camera.position.x,
                  y: camera.position.y,
                  z: camera.position.z,
                },
                target: {
                  x: camera.target.x,
                  y: camera.target.y,
                  z: camera.target.z,
                },
                preview: detailScreenshot,
              },
            },
          },
          target: {
            source: {
              relatedModel: this.currentModel._id,
              relatedCompilation: this.isCollection ? this.currentCompilation._id : '',
            },
            selector: {
              referencePoint: {
                x: result.pickedPoint.x,
                y: result.pickedPoint.y,
                z: result.pickedPoint.z,
              },
              referenceNormal: {
                x: result.getNormal(true, true).x,
                y: result.getNormal(true, true).y,
                z: result.getNormal(true, true).z,
              },
            },
          },
        };

        console.log(newAnnotation);
        this.add(newAnnotation);
      });
  }

  private add(annotation: IAnnotation): void {

    if (this.isDefaultModelLoaded) {
      annotation.lastModificationDate = new Date().toISOString();
      this.socketService.annotationForSocket(annotation, 'update');
      if (this.inSocket) {
        this.annotations.push(this.socketService.modifyAnnotationforSocket(annotation));
      } else {
        this.annotations.push(annotation);
        this.drawMarker(annotation);
      }
      this.selectedAnnotation.next(annotation._id);
      this.editModeAnnotation.next(annotation._id);
      this.defaultAnnotationsSorted.push(annotation);
      return;
    }

    this.mongo.updateAnnotation(annotation)
      .toPromise()
      .then((resultAnnotation: IAnnotation) => {
        console.log('Die result Anno:', resultAnnotation);
        // MongoDB hat funktioniert
        // MongoDB-Eintrag in PouchDB
        this.dataService.updateAnnotation(resultAnnotation);

        if (this.isannotationSourceCollection) {
          this.socketService.annotationForSocket(resultAnnotation, 'update');
          this.collectionAnnotationsSorted.push(resultAnnotation);
        } else {
          this.defaultAnnotationsSorted.push(resultAnnotation);
        }

        if (this.inSocket) {
          this.annotations.push(this.socketService.modifyAnnotationforSocket(resultAnnotation));
        } else {
          this.annotations.push(annotation);
          this.drawMarker(annotation);
        }
        this.selectedAnnotation.next(annotation._id);
        this.editModeAnnotation.next(annotation._id);
      })
      .catch((errorMessage: any) => {
        // PouchDB
        annotation.lastModificationDate = new Date().toISOString();
        console.log(errorMessage);

        this.dataService.updateAnnotation(annotation);

        if (this.isannotationSourceCollection) {
          this.socketService.annotationForSocket(annotation, 'update');
          this.collectionAnnotationsSorted.push(annotation);
        } else {
          this.defaultAnnotationsSorted.push(annotation);
        }

        if (this.inSocket) {
          this.annotations.push(this.socketService.modifyAnnotationforSocket(annotation));
        } else {
          this.annotations.push(annotation);
          this.drawMarker(annotation);
        }
        this.selectedAnnotation.next(annotation._id);
        this.editModeAnnotation.next(annotation._id);

      });
  }

  public updateAnnotation(annotation: IAnnotation) {
    if (this.isDefaultModelLoaded) {
      annotation.lastModificationDate = new Date().toISOString();
      this.socketService.annotationForSocket(annotation, 'update');
      if (!this.inSocket) {
        this.annotations.splice(this.annotations.indexOf(annotation), 1, annotation);
      }
      this.defaultAnnotationsSorted.splice(this.annotations.indexOf(annotation), 1, annotation);
      return;
    }

    this.mongo.updateAnnotation(annotation)
      .toPromise()
      .then((resultAnnotation: IAnnotation) => {
        // MongoDB hat funktioniert
        // MongoDB-Eintrag in PouchDB
        this.dataService.updateAnnotation(resultAnnotation);

        if (this.isannotationSourceCollection) {
          this.socketService.annotationForSocket(resultAnnotation, 'update');
          this.collectionAnnotationsSorted.splice(this.annotations.indexOf(resultAnnotation), 1, resultAnnotation);
        } else {
          this.defaultAnnotationsSorted.splice(this.annotations.indexOf(resultAnnotation), 1, resultAnnotation);
        }

        if (!this.inSocket) {
          this.annotations.splice(this.annotations.indexOf(resultAnnotation), 1, resultAnnotation);
        }
      })
      .catch((errorMessage: any) => {
        // PouchDB
        // TODO: Später synchronisieren
        console.log(errorMessage);
        annotation.lastModificationDate = new Date().toISOString();
        this.dataService.updateAnnotation(annotation);

        if (this.isannotationSourceCollection) {
          this.socketService.annotationForSocket(annotation, 'update');
          this.collectionAnnotationsSorted.splice(this.annotations.indexOf(annotation), 1, annotation);
        } else {
          this.defaultAnnotationsSorted.splice(this.annotations.indexOf(annotation), 1, annotation);
        }

        if (!this.inSocket) {
          this.annotations.splice(this.annotations.indexOf(annotation), 1, annotation);
        }
      });
  }

  public deleteAnnotation(annotation: IAnnotation) {

    if (this.userdataService.isAnnotationOwner(annotation)) {

      if (this.isDefaultModelLoaded) {
        const index: number = this.annotations.indexOf(annotation);
        if (index !== -1) {
          if (!this.inSocket) {
            this.annotations.splice(index, 1);
          }
          this.defaultAnnotationsSorted.splice(this.annotations.indexOf(annotation), 1);
          this.socketService.annotationForSocket(annotation, 'delete');
          this.changedRankingPositions(this.annotations);
          this.redrawMarker();
        }
        return;
      }

      if (this.isannotationSourceCollection) {
        this.socketService.annotationForSocket(annotation, 'delete');
        this.collectionAnnotationsSorted
          .splice(this.annotations.indexOf(annotation), 1);
      } else {
        this.defaultAnnotationsSorted
          .splice(this.annotations.indexOf(annotation), 1);
      }

      this.dataService.deleteAnnotation(annotation._id);
      if (!this.inSocket) {
        this.annotations
          .splice(this.annotations.indexOf(annotation), 1);
      }
      this.changedRankingPositions(this.annotations);
      this.redrawMarker();

      this.deleteAnnotationFromServer(annotation._id);

    } else {
      this.message.error('You are not the Owner of this Annotation.');
    }
  }

  public deleteAnnotationFromServer(annotationId: string) {
    // User pwd check for deliting on Server
    const username = this.userdataService.cachedLoginData.username;
    const password = this.userdataService.cachedLoginData.password;

    if (username === '' || password === '') {
      this.passwordDialog(annotationId);
    } else {

      this.mongo.deleteRequest(annotationId, 'annotation', username, password)
        .toPromise()
        .then((result: any) => {
          if (result.status === 'ok') {
            this.message.info('Deleted from Server');
          } else {
            this.message.info('Not deleted from Server');
            this.passwordDialog(annotationId);
          }
        })
        .catch((errorMessage: any) => {
          console.log(errorMessage);
          this.message.error('Can not see if you are logged in.');
        });
    }
  }

  public passwordDialog(annotationId: string) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: annotationId,
    };

    const dialogRef = this.dialog.open(DialogGetUserDataComponent, dialogConfig);
    dialogRef.afterClosed()
      .subscribe(data => {
        if (data === true) {
          this.message.info('Deleted from Server');
        } else {
          this.message.info('Not deleted from Server');
        }
      });

  }

  public async changedRankingPositions(annotationArray: IAnnotation[]) {

    let i = 0;
    for (const annotation of annotationArray) {
      if (annotation._id) {
        if (annotation.ranking !== i + 1) {
          annotation.ranking = i + 1;
          this.updateAnnotation(annotation);
        }
        i++;
      }
    }

    // Zoe sagt: ist wahrscheinlich überflüssig, wird durch Update erledigt.
    // 1.1.3
    // - Ranking der Annotation ändern
    /*
    if (this.inSocket) {
      const IdArray = new Array();
      const RankingArray = new Array();
      for (const annotation of this.annotations) {
        IdArray.push(annotation._id);
        RankingArray.push(annotation.ranking);
      }
      // Send ID's & new Ranking of changed annotations
      if (this.inSocket) {
        this.socket.emit('changeRanking', {oldRanking: IdArray, newRanking: RankingArray});
      }
    }*/
  }

  private async fetchAnnotations(model: string, compilation?: string): Promise<IAnnotation[]> {
    return new Promise<IAnnotation[]>(async (resolve, reject) => {
      const annotationList: IAnnotation[] = await this.dataService
        .findAnnotations(model, (compilation) ? compilation : '');
      resolve(annotationList);
    });
  }

  public async redrawMarker() {

    if (!this.inSocket) {
      await this.annotationmarkerService.deleteAllMarker();

      for (const annotation of this.annotations) {
        const color = 'black';
        this.annotationmarkerService.createAnnotationMarker(annotation, color);
      }
    } else {
      this.socketService.redrawMarker();
    }
  }

  public drawMarker(newAnnotation: IAnnotation) {
    if (!this.inSocket) {
      const color = 'black';
      this.annotationmarkerService.createAnnotationMarker(newAnnotation, color);
    } else {
      this.socketService.drawMarker(newAnnotation);
    }
  }

  public setSelectedAnnotation(id: string) {
    this.selectedAnnotation.next(id);
  }

  public setEditModeAnnotation(id: string) {
    this.editModeAnnotation.next(id);
  }

  public async shareAnnotation(annotation: IAnnotation) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      modelId: this.currentModel._id,
    };

    const dialogRef = this.dialog.open(DialogShareAnnotationComponent, dialogConfig);
    dialogRef.afterClosed()
      .subscribe(data => {
        if (data.status === true) {
          const copyAnnotation = this.createCopyOfAnnotation(annotation, data.collectionId, data.annotationListLength);

          this.mongo.updateAnnotation(copyAnnotation)
            .subscribe(result => {
              console.log('Status1: ', result);
              if (result.status === 'ok') {
                this.message.error('Annotation is shared to Collection with id: ' + data.collectionId);
              } else {
                console.log('Status: ', result);
              }
            },         error => {
              this.message.error('Annotation can not be shared.');
            });
        } else {
          this.message.error('Annotation has not been shared.');
        }
      });
  }

  public createCopyOfAnnotation(annotation: IAnnotation, collectionId: string,
                                annotationLength: number): any {
    console.log('Erstelle die Kopie');

    let generatedId = this.mongo.generateObjectId();
    // TODO async
    this.mongo.getUnusedObjectId()
      .then(id => generatedId = id)
      .catch(e => console.error(e));

    return {
      validated: false,
      _id: generatedId,
      identifier: generatedId,
      ranking: String(annotationLength + 1),
      creator: annotation.creator,
      created: annotation.created,
      generator: annotation.generator,
      motivation: annotation.motivation,
      lastModifiedBy: {
        type: 'person',
        name: this.userdataService.currentUserData.fullname,
        _id: this.userdataService.currentUserData._id,
      },
      body: annotation.body,
      target: {
        source: {
          relatedModel: this.currentModel._id,
          relatedCompilation: collectionId,
        },
        selector: annotation.target.selector,
      },
    };
  }

  public createDefaultAnnotation(): IAnnotation {
    if (this.isFallbackModelLoaded) {
      return {
        validated: true,
        _id: 'DefaultAnnotation',
        identifier: 'DefaultAnnotation',
        ranking: 1,
        creator: {
          type: 'Person',
          name: 'Zoe Schubert',
          _id: '5c8802f7a54bc22820290d68',
        },
        created: '2019-04-30T15:14:41.583Z',
        generator: {
          type: 'Person',
          name: 'Get User Name',
          _id: 'Get User ID',
        },
        generated: 'Creation-Timestamp by Server',
        motivation: 'defaultMotivation',
        lastModificationDate: 'Last-Manipulation-Timestamp by Server',
        lastModifiedBy: {
          type: 'Person',
          name: 'Get User Name',
          _id: 'Get User ID',
        },
        body: {
          type: 'annotation',
          content: {
            type: 'text',
            title: 'Hi there!',
            description: 'maybe this is not what you were looking for. Unfortunately we cannot display the requested object but we are working on it. But we have something better as you can see... This model is from https://sketchfab.com/mark2580',
            relatedPerspective: {
              cameraType: 'arcRotateCam',
              position: {
                x: 2.7065021761026817,
                y: 1.3419080619941322,
                z: 90.44884111420268,
              },
              target: {
                x: 0,
                y: 0,
                z: 0,
              },
              preview: 'data:image/png;base64,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',
            },
          },
        },
        target: {
          source: {
            relatedModel: 'Cube',
          },
          selector: {
            referencePoint: {
              x: -10.204414220764392,
              y: 10.142734374740286,
              z: -3.9197811803792177,
            },
            referenceNormal: {
              x: -0.8949183602315889,
              y: 0.011999712324764563,
              z: -0.44606853220612525,
            },
          },
        },
      };
    } else {
    return {
      validated: true,
      _id: 'DefaultAnnotation',
      identifier: 'DefaultAnnotation',
      ranking: 1,
      creator: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'userID',
      },
      created: '2019-01-18T22:05:31.230Z',
      generator: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'Get User ID',
      },
      generated: 'Creation-Timestamp by Server',
      motivation: 'defaultMotivation',
      lastModificationDate: 'Last-Manipulation-Timestamp by Server',
      lastModifiedBy: {
        type: 'Person',
        name: 'Get User Name',
        _id: 'Get User ID',
      },
      body: {
        type: 'annotation',
        content: {
          type: 'text',
          title: 'Welcome to Kompakkt',
          description: '![alt Kompakkt Logo](https://raw.githubusercontent.com/DH-Cologne/Kompakkt/master/src/assets/img/kompakkt-logo.png)' +
            'Hi! I am an annotation of this cool logo. Please feel free to add a friend for me by clicking on the edit button in the corner on the right bottom and double click this 3D logo!',
          relatedPerspective: {
            cameraType: 'arcRotateCam',
            position: {
              x: 2.7065021761026817,
              y: 1.3419080619941322,
              z: 90.44884111420268,
            },
            target: {
              x: 0,
              y: 0,
              z: 0,
            },
            preview: 'data:image/png;base64,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KfdQBMipjnPPPTcmTJgQw4YNK/f26quvlsGyefPmHhk5mUBfCAiQvlB2jaYEzjjjjJgyZUo899xzZZ19+/bFmjVrjv9Fv2jRsQA58WJTp06NadOmRfHKqKtj8ODBMXbs2PJppfir2+cv/ij+6ZXfxs//cuyxV1jrtx+KWX9+dVli//79sXr178Kk87Fz58548skny2A73VGE23XXXRcTJ048bdAVNYq9jRs3rtx/YVEEysKFC4VKU3eVxSkEBEgKRTWSC4waNSrmzp0b1157bRw+fDi2bNkSxS/nUx2ff/55PP744w3vofhlPHv27PIJ5HTHmDFjYuvWrfH111+Xp51zzjlx4MCBk5bs3bs3HnnkkXKfzR433HBDQ6FSXGf8+PHla7kzzzwz1q1bFwsWLCg/c+kuvJrdo/UEfi8gQNwLLSEwaNCgmDVrVhSvdo4ePRrFL+VTvRYqNvvNN9/EkiVLunziqNJQ8dRQhFbx9NHIUezx5ZdfLp8GevMoPh+58cYb44ILLiiDorujeIoaOnRo+fprw4YNpdOHH354LAS7W+/nBHoiIEB6ouXcpALFL7o333yzrHnkyJEyMIpXQ6c6iqeA++67L+n1T1fs9ttvL1+bnX322ced9u6778bzzz/fZ/s41YWKz0luueWWGDlyZPlKq7ujeNIqwrEIoCL4XnzxxXj77bfj22+P/7ynuzp+TuBEAQHinugzgeK/7u+55564++67y2sWr56KV1NdHdu2bYsnnniiz/ZX5wsVQTdjxozy22aNHEUIFh/+Owg0IyBAmtGztluByZMnx7PPPlu+UimOFStWlK+gujrmz58fK1euLP9L2VFdoAjr4ttot95660lPUUXVZ555pnpxKwn8v4AAcSskFyg+oL733nvLusWH0MWTxOlelzz44IOn/HA6+cYyL1i8wrrwwgvLMC/+kKODQLMCAqRZQetPEii+Mjtz5swuZd5666147bXXfFvIvUOg5gICpOYDbMXtX3755XH//fcft7V58+aV3wpyECDQPgICpH1m2VKdFN8OKr6CumPHjpbal80QIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQESDpLlQgQIJCVgADJatyaJUCAQDoBAZLOUiUCBAhkJSBAshq3ZgkQIJBOQICks1SJAAECWQkIkKzGrVkCBAikExAg6SxVIkCAQFYCAiSrcWuWAAEC6QQGpCulEgECBAjkJCBAcpq2XgkQIJBQQIAkxFSKAAECOQkIkJymrVcCBAgkFBAgCTGVIkCAQE4CAiSnaeuVAAECCQUESEJMpQgQIJCTgADJadp6JUCAQEIBAZIQUykCBAjkJCBAcpq2XgkQIJBQQIAkxFSKAAECOQkIkJymrVcCBAgkFBAgCTGVIkCAQE4CAiSnaeuVAAECCQUESEJMpQgQIJCTgADJadp6JUCAQEIBAZIQUykCBAjkJCBAcpq2XgkQIJBQQIAkxFSKAAECOQkIkJymrVcCBAgkFBAgCTGVIkCAQE4CAiSnaeuVAAECCQUESEJMpQgQIJCTgADJadp6JUCAQEIBAZIQUykCBAjkJCBAcpq2XgkQIJBQQIAkxFSKAAECOQkIkJymrVcCBAgkFBAgCTGVIkCAQE4C/weLi1NGQXXHbQAAAABJRU5ErkJggg==',
          },
        },
      },
      target: {
        source: {
          relatedModel: 'Cube',
        },
        selector: {
          referencePoint: {
            x: 0.7365755065717517,
            y: -0.08506122964733329,
            z: 0.6709851789193639,
          },
          referenceNormal: {
            x: 4.501424756469078,
            y: -0.005906091577992267,
            z: -1.320959064249699,
          },
        }}}; }
  }

  public setAnnotatingAllowance() {

    if (this.isOpen && !this.isMeshSettingsMode) {
      if (this.isCollectionInputSelected) {
        this.annotationMode(true);
        this.isAnnotatingAllowed = true;
        this.annnotatingAllowed.emit(true);
        this.socketService.setBroadcastingAllowance(true);
      } else {
        this.isDefaultModelLoaded ?
          this.socketService.setBroadcastingAllowance(true) :
          this.socketService.setBroadcastingAllowance(false);

        this.isAnnotatingAllowed = this.userdataService.isModelOwner ||
          this.processingService.isDefaultModelLoaded;
        this.annotationMode(this.isAnnotatingAllowed);
        this.annnotatingAllowed.emit(this.isAnnotatingAllowed);
      }
    } else {
      this.socketService.setBroadcastingAllowance(false);
      this.isAnnotatingAllowed = false;
      this.annotationMode(false);
      this.annnotatingAllowed.emit(false);
    }
  }

  public setCollectionInput(selected: boolean) {
    this.isCollectionInputSelected = selected;
    this.toggleAnnotationSource(selected, false);
    this.setAnnotatingAllowance();
  }

  // Das aktuelle Modell wird anklickbar und damit annotierbar
  public annotationMode(value: boolean) {
    this.actualModelMeshes.forEach(mesh => {
      this.actionService.pickableModel(mesh, value);
    });
  }

  public toggleAnnotationSource(sourceCol: boolean, initial?: boolean) {

    if (initial) {
      this.annotations = JSON.parse(JSON.stringify(this.isannotationSourceCollection ?
        this.collectionAnnotationsSorted : this.defaultAnnotationsSorted));
      this.redrawMarker();
    } else {
      if (sourceCol === this.isannotationSourceCollection) {
        return;
      } else {
        this.isannotationSourceCollection = sourceCol;
        this.annotations = JSON.parse(JSON.stringify(this.isannotationSourceCollection ?
          this.collectionAnnotationsSorted : this.defaultAnnotationsSorted));
        this.redrawMarker();
      }
    }
  }
}
