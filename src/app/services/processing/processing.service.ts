import { EventEmitter, Injectable, Output } from '@angular/core';
import { Mesh } from 'babylonjs';
import { BehaviorSubject } from 'rxjs';
import { ReplaySubject } from 'rxjs/internal/ReplaySubject';

import { baseEntity } from '../../../assets/defaults';
import { defaultEntity, fallbackEntity } from '../../../assets/entities/entities';
import { environment } from '../../../environments/environment';
import { ICompilation, IEntity } from '../../interfaces/interfaces';
import { BabylonService } from '../babylon/babylon.service';
import { LoadingscreenhandlerService } from '../babylon/loadingscreen';
import { MessageService } from '../message/message.service';
import { MetadataService } from '../metadata/metadata.service';
import { MongohandlerService } from '../mongohandler/mongohandler.service';
import { OverlayService } from '../overlay/overlay.service';

@Injectable({
  providedIn: 'root',
})
export class ProcessingService {
  private Subjects = {
    entities: new BehaviorSubject<IEntity[]>(Array<IEntity>()),
    collections: new BehaviorSubject<ICompilation[]>(Array<ICompilation>()),
    actualEntity: new ReplaySubject<IEntity>(),
    actualEntityMeshes: new ReplaySubject<Mesh[]>(),
    actualCollection: new ReplaySubject<ICompilation | undefined>(),
    actualMediaType: new ReplaySubject<string>(),
  };

  public Observables = {
    entities: this.Subjects.entities.asObservable(),
    collections: this.Subjects.collections.asObservable(),
    actualEntity: this.Subjects.actualEntity.asObservable(),
    actualEntityMeshes: this.Subjects.actualEntityMeshes.asObservable(),
    actualCollection: this.Subjects.actualCollection.asObservable(),
    actualMediaType: this.Subjects.actualMediaType.asObservable(),
  };

  // private isLoaded = false;
  public isCollectionLoaded = false;
  public isDefaultEntityLoaded = false;
  public isFallbackEntityLoaded = false;
  public isLightMode = true;
  public isLoggedIn = false;
  public isShowCatalogue = false;
  public isShowMetadata = false;

  @Output() loaded: EventEmitter<boolean> = new EventEmitter();
  @Output() collectionLoaded: EventEmitter<boolean> = new EventEmitter();
  @Output() defaultEntityLoaded: EventEmitter<boolean> = new EventEmitter();
  @Output() fallbackEntityLoaded: EventEmitter<boolean> = new EventEmitter();
  @Output() lightMode: EventEmitter<boolean> = new EventEmitter();
  @Output() loggedIn: EventEmitter<boolean> = new EventEmitter();
  @Output() showCatalogue: EventEmitter<boolean> = new EventEmitter();
  @Output() showMetadata: EventEmitter<boolean> = new EventEmitter();

  private baseUrl = `${environment.express_server_url}:${environment.express_server_port}/`;
  public quality = 'low';

  constructor(
    private mongoHandlerService: MongohandlerService,
    private message: MessageService,
    private overlayService: OverlayService,
    public babylonService: BabylonService,
    private loadingScreenHandler: LoadingscreenhandlerService,
    private metadataService: MetadataService,
  ) {}

  public getCurrentEntity(): IEntity | undefined {
    return this.Observables.actualEntity.source['_events'].slice(-1)[0];
  }

  public getCurrentCompilation(): ICompilation | undefined {
    return this.Observables.actualCollection.source['_events'].slice(-1)[0];
  }

  public getCurrentMediaType(): string {
    return this.Observables.actualMediaType.source['_events'].slice(-1)[0]
      ? this.Observables.actualMediaType.source['_events'].slice(-1)[0]
      : '';
  }

  public updateActiveEntity(entity: IEntity) {
    this.Subjects.actualEntity.next(entity);
    if (entity && (entity._id === 'default' || entity._id === 'fallback')) {
      this.isDefaultEntityLoaded = entity._id === 'default';
      this.defaultEntityLoaded.emit(entity._id === 'default');

      this.isFallbackEntityLoaded = entity._id === 'fallback';
      this.fallbackEntityLoaded.emit(entity._id === 'fallback');
    } else {
      this.isDefaultEntityLoaded = false;
      this.defaultEntityLoaded.emit(false);
    }
  }

  public updateActiveCollection(collection: ICompilation | undefined) {
    this.Subjects.actualCollection.next(collection);
    if (collection && collection._id) {
      this.isCollectionLoaded = true;
      this.collectionLoaded.emit(true);
    } else {
      this.isCollectionLoaded = false;
      this.collectionLoaded.emit(false);
    }
  }

  public updateActiveEntityMeshes(meshes: Mesh[]) {
    console.log('meshes: ', meshes);
    this.Subjects.actualEntityMeshes.next(meshes);
  }

  public setupDragAndDrop() {
    const readDir = async dir => {
      const dirReader = dir.createReader();
      return new Promise<File[]>((resolve, _) => {
        const files: File[] = [];
        dirReader.readEntries((entries: any[]) => {
          for (let i = 0; i < entries.length; i++) {
            entries[i].file(file => {
              files.push(file);
              if (i === entries.length - 1) {
                resolve(files);
              }
            });
          }
        });
      });
    };

    document.ondrop = async event => {
      if (!event.dataTransfer) {
        console.warn('No dataTransfer on event', event);
        return;
      }
      console.log('Drop event', event, event.dataTransfer.files);
      event.preventDefault();
      mediaType = '';
      fileExts.splice(0, fileExts.length);
      fileList.splice(0, fileList.length);
      window.top.postMessage({ type: 'resetQueue' }, environment.repository);
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        const _item = event.dataTransfer.items[i];
        const _entry = _item.webkitGetAsEntry();
        console.log(_entry);
        if (_entry.isDirectory) {
          const res = await readDir(_entry);
          console.log(res);
          fileList.push(...res);
        } else {
          await new Promise((resolve, _) => {
            _entry.file(file => {
              fileList.push(file);
              resolve();
            });
          });
        }
      }
      for (const _file of fileList) {
        const _fileName = _file.name;
        const _ext = _fileName.substr(_fileName.lastIndexOf('.'));
        fileExts.push(_ext.toLowerCase());
      }

      getMediaType();

      window.top.postMessage(
        { files: fileList, mediaType, type: 'fileList' },
        environment.repository,
      );
    };
    document.ondragover = event => {
      event.preventDefault();
      // TODO: document.ondragover for cool effects
    };

    // Determine mediaType by extension
    const modelExts = ['.babylon', '.obj', '.stl', '.glft', '.glb'];
    const imageExts = ['.jpg', '.jpeg', '.png', '.tga', '.gif', '.bmp'];
    const videoExts = ['.webm', '.mp4', '.ogv'];
    const audioExts = ['.ogg', '.mp3', '.m4a'];
    const fileExts: string[] = [];
    const fileList: File[] = [];
    let mediaType = '';
    let ext = '.babylon';
    let largest: any;
    let blobList: Array<{
      name: string;
      blob: string;
    }> = [];
    const getMediaType = () => {
      const _countMedia = {
        model: 0,
        image: 0,
        video: 0,
        audio: 0,
      };

      // Count file occurences
      for (const _ext of fileExts) {
        switch (true) {
          case modelExts.includes(_ext):
            _countMedia.model++;
            break;
          case imageExts.includes(_ext):
            _countMedia.image++;
            break;
          case videoExts.includes(_ext):
            _countMedia.video++;
            break;
          case audioExts.includes(_ext):
            _countMedia.audio++;
            break;
          default:
        }
      }

      // Since this is checking in order (3d model first)
      // we are able to determine entities, even if e.g. textures are
      // also found
      switch (true) {
        case _countMedia.model > 0:
          mediaType = 'model';
          break;
        case _countMedia.image > 0:
          mediaType = 'image';
          break;
        case _countMedia.video > 0:
          mediaType = 'video';
          break;
        case _countMedia.audio > 0:
          mediaType = 'audio';
          break;
        default:
      }

      // Read content of single non-model file
      if (mediaType !== 'model') {
        if (fileList.length > 1) {
          return;
          // Too many files
        }
        loadFile(fileList[0]);
      } else {
        largest = fileList
          .filter(file =>
            modelExts.includes(file.name.substr(file.name.lastIndexOf('.'))),
          )
          .sort((a, b) => b.size - a.size)[0];
        blobList = fileList
          .filter(
            file =>
              !modelExts.includes(file.name.substr(file.name.lastIndexOf('.'))),
          )
          .map(file => {
            const item = { name: file.name, blob: URL.createObjectURL(file) };
            item.blob = item.blob.slice(item.blob.lastIndexOf('/') + 1);
            return item;
          });
        this.loadingScreenHandler.updateLoadingText(
          `Loading ${largest.name}. Please wait...`,
        );
        ext = largest.name.substr(largest.name.lastIndexOf('.'));
        loadFile(largest);
      }
    };

    const loadFile = async (file: File) => {
      console.log(file);
      const fileAsText = await (file['text']() as Promise<string>).then(
        result => {
          for (const item of blobList) {
            result = result.replace(item.name, item.blob);
          }
          return result;
        },
      );
      const newFile = new File([fileAsText], file.name);
      console.log(newFile);
      const blob = URL.createObjectURL(file);

      // TODO: Replace filenames in entity File && blobList files with
      // corresponding blob URL
      console.log('Entity URL:', blob, blobList);
      this.loadEntity(
        {
          ...baseEntity(),
          _id: 'dragdrop',
          name: 'dragdrop',
          mediaType,
          dataSource: {
            isExternal: false,
            service: '',
          },
          processed: { low: blob, medium: blob, high: blob, raw: blob },
        },
        '',
        ext,
      ).then(() => this.loaded.emit(true));
    };

    this.babylonService.getEngine().loadingUIText =
      // tslint:disable-next-line:max-line-length
      `Drop a single file (model, image, audio, video) or a folder containing a 3d model here`;
  }

  public bootstrap(): void {
    const searchParams = location.search;
    const queryParams = new URLSearchParams(searchParams);
    const entityParam = queryParams.get('model') || queryParams.get('entity');
    const compParam = queryParams.get('compilation');
    // values = dragdrop, explore, edit, annotation, ilias, full
    const mode = queryParams.get('mode');

    const loadingCase =
      entityParam !== null || undefined
        ? 'entity'
        : compParam !== null || undefined
        ? 'collection'
        : 'default';

    if (mode === 'dragdrop') {
      this.isLightMode = false;
      this.lightMode.emit(false);
      this.setupDragAndDrop();
      return;
    }

    if (loadingCase === 'entity') {
      this.fetchAndLoad(
        entityParam ? entityParam : undefined,
        compParam ? compParam : undefined,
        !!compParam,
      );
      if (mode === 'explore') {
        this.isLightMode = false;
        this.lightMode.emit(false);
        this.overlayService.activateSettingsTab();
      }
      if (mode === 'annotation') {
        this.mongoHandlerService
          .isAuthorized()
          .then(result => {
            if (result.status === 'ok') {
              this.isLightMode = false;
              this.lightMode.emit(false);
              this.overlayService.activateAnnotationsTab();
              this.isLoggedIn = true;
              this.loggedIn.emit(true);
            } else {
              // tslint:disable-next-line:max-line-length
              this.message.error('You are not logged in and this would be necessary to annotate this object.' +
                  'Please reload the page if you want to log in.');
              this.isLoggedIn = false;
              this.loggedIn.emit(false);
              this.isLightMode = true;
              this.lightMode.emit(true);
            }
          })
          .catch(error => {
            console.error(error);
            this.isLoggedIn = false;
            this.loggedIn.emit(false);
            // tslint:disable-next-line:max-line-length
            this.message.error('I can not check if you are logged in. The server is not responding.' +
                'That means I can not initialise the annotation mode.');
          });
      }
      if (mode === 'edit') {
        this.mongoHandlerService
          .isAuthorized()
          .then(result => {
            if (result.status === 'ok') {
              this.isLightMode = false;
              this.lightMode.emit(false);
              this.overlayService.activateSettingsTab();
              this.isLoggedIn = true;
              this.loggedIn.emit(true);
            } else {
              // tslint:disable-next-line:max-line-length
              this.message.error('You are not logged in and this would be necessary to edit this object.' +
                  'Please reload the page if you want to log in.');
              this.isLoggedIn = false;
              this.loggedIn.emit(false);
              this.isLightMode = true;
              this.lightMode.emit(true);
            }
          })
          .catch(error => {
            console.error(error);
            this.isLoggedIn = false;
            this.loggedIn.emit(false);
            // tslint:disable-next-line:max-line-length
            this.message.error('I can not check if you are logged in. The server is not responding.' +
                'That means I can not initialise the edit mode.');
          });
      }
    }

    if (loadingCase === 'default') {
      this.loadDefaultEntityData();
      if (mode === 'annotation') {
        this.isLightMode = false;
        this.lightMode.emit(false);
        this.overlayService.activateAnnotationsTab();
      }
      if (mode === 'fullLoad') {
        this.isLightMode = false;
        this.lightMode.emit(false);
        this.isShowCatalogue = true;
        this.showCatalogue.emit(true);
        this.isShowMetadata = true;
        this.showMetadata.emit(true);

        this.mongoHandlerService
          .isAuthorized()
          .then(result => {
            if (result.status === 'ok') {
              this.fetchCollectionsData();
              this.fetchEntitiesData();
              this.isLoggedIn = true;
              this.loggedIn.emit(true);
            } else {
              // tslint:disable-next-line:max-line-length
              this.message.error('You are not logged in and this would be necessary to initialise the catalogue.' +
                  'Please log in if you want to use this functionality.');
              this.isLoggedIn = false;
              this.loggedIn.emit(false);
            }
          })
          .catch(error => {
            console.error(error);
            this.isLoggedIn = false;
            this.loggedIn.emit(false);
            // tslint:disable-next-line:max-line-length
            this.message.error('I can not check if you are logged in. The server is not responding.' +
                'That means I can not initialise the catalogue. ');
          });
      }
    }

    if (loadingCase === 'collection') {
      this.fetchAndLoad(
        undefined,
        compParam ? compParam : undefined,
        undefined,
      );
      this.overlayService.toggleCollectionsOverview();
      if (mode === 'ilias') {
        this.isShowMetadata = true;
        this.showMetadata.emit(true);
        this.mongoHandlerService
          .isAuthorized()
          .then(result => {
            if (result.status === 'ok') {
              this.isLightMode = false;
              this.lightMode.emit(false);
              this.isLoggedIn = true;
              this.loggedIn.emit(true);
            } else {
              // tslint:disable-next-line:max-line-length
              this.message.error('You are not logged in and this would be necessary to initialise the full functionality.' +
                  'Please reload the page if you want to log in');
              this.isLightMode = true;
              this.lightMode.emit(true);
              this.isLoggedIn = false;
              this.loggedIn.emit(false);
            }
          })
          .catch(error => {
            console.error(error);
            this.isLoggedIn = false;
            this.loggedIn.emit(false);
            // tslint:disable-next-line:max-line-length
            this.message.error('I can not check if you are logged in. The server is not responding.' +
                'That means I can not initialise the full functionality.');
          });
      }
    }
  }

  public loadDefaultEntityData() {
    this.loaded.emit(false);
    this.quality = 'low';
    this.Subjects.actualMediaType.next('entity');
    this.loadEntity(defaultEntity, '')
      .then(() => {
        this.loaded.emit(true);
        this.metadataService.addDefaultMetadata();
      })
      .catch(error => {
        console.error(error);
        this.loadFallbackEntity()
            .then(() => {
              // TODO add annotation
            })
            .catch(e => {
              console.error(e);
              this.message.error('Loading of Objects does not work. Please tell us about it!');
            });
      });
  }

  // 1. default lädt nicht
  public async loadFallbackEntity() {
    this.loaded.emit(false);
    this.quality = 'low';
    this.Subjects.actualMediaType.next('entity');
    await this.loadEntity(fallbackEntity, '', '.gltf')
      .then(() => {
        this.loaded.emit(true);
        // TODO this.metadataService.addFallbackMetadata();
      })
      .catch(error => {
        console.error(error);
        this.message.error('Loading of Objects does not work. Please tell us about it!');
      });
  }

  public fetchAndLoad(
    entityId?: string,
    collectionId?: string,
    isfromCollection?: boolean,
  ) {
    this.loaded.emit(false);
    this.quality = 'low';
    if (entityId) {
      this.fetchEntityData(entityId);
      if (!isfromCollection) {
        this.updateActiveCollection(undefined);
      }
    }
    if (collectionId) {
      this.mongoHandlerService
        .getCompilation(collectionId)
        .then(compilation => {
          // TODO: Put Typeguards in its own service?
          const isEntity = (obj: any): obj is IEntity => {
            const _entity = obj as IEntity;
            return (
              _entity &&
              _entity.name !== undefined &&
              _entity.mediaType !== undefined &&
              _entity.online !== undefined &&
              _entity.finished !== undefined
            );
          };
          this.updateActiveCollection(compilation);
          const entity = compilation.entities[0];
          if (isEntity(entity)) this.fetchEntityData(entity._id);
        })
        .catch(error => {
          console.error(error);
          /*this.message.error(
'Connection to entity server to load compilation refused.',
);*/
          this.loadFallbackEntity()
              .then(() => {
                // TODO add annotation
              })
              .catch(e => {
                console.error(e);
                this.message.error('Loading of Objects does not work. Please tell us about it!');
              });
        });
    }
  }

  public fetchEntityData(query: string) {
    this.mongoHandlerService
      .getEntity(query)
      .then(resultEntity => {
        this.loadEntity(resultEntity)
          .then(result => {
            this.loaded.emit(true);
            console.log('Load:', result);
          })
          .catch(error => {
            console.error(error);
            /*this.message.error(
            'Connection to entity server to load entity refused.',
            );*/
            this.loadFallbackEntity()
                .then(() => {
                  // TODO add annotation
                })
                .catch(e => {
                  console.error(e);
                  // tslint:disable-next-line:max-line-length
                  this.message.error('Loading of this Objects does not work. Please tell us about it!');
                });
          });
      })
        .catch(error => {
          console.error(error);
          /*this.message.error(
          'Connection to entity server to load entity refused.',
          );*/
          this.loadFallbackEntity()
              .then(() => {
                // TODO add annotation
            })
            .catch(e => {
              console.error(e);
              this.message.error('Loading of Objects does not work. Please tell us about it!');
            });
      });
  }

  public async loadEntity(
    newEntity: IEntity,
    overrideUrl?: string,
    extension = '.babylon',
  ) {
    const URL = overrideUrl !== undefined ? overrideUrl : this.baseUrl;
    if (
      !this.loadingScreenHandler.isLoading &&
      newEntity.processed &&
      newEntity.mediaType
    ) {
      if (!newEntity.dataSource.isExternal) {
        // cases: entity, image, audio, video, text
        const _url = URL + newEntity.processed[this.quality];
        const mediaType = newEntity.mediaType;
        switch (newEntity.mediaType) {
          case 'model':
          case 'entity':
            await this.babylonService
                .loadEntity(
                    true,
                    _url,
                    mediaType,
                    extension,
                    newEntity._id === 'default',
                )
                .then(() => {
                  this.Subjects.actualMediaType.next('entity');
                  this.updateActiveEntity(newEntity);
                  this.updateActiveEntityMeshes(this.babylonService
                      .entityContainer.meshes as Mesh[]);
                })
                .catch(error => {
                  console.error(error);
                  /*this.message.error(
                  'Connection to entity server to load entity refused.',
                  );*/
                  this.loadFallbackEntity()
                      .then(() => {
                        // TODO add annotation
                      })
                      .catch(e => {
                        console.error(e);
                        // tslint:disable-next-line:max-line-length
                        this.message.error('Loading of Objects does not work. Please tell us about it!');
                      });
                });
            break;
          case 'image':
            await this.babylonService
              .loadEntity(true, _url, mediaType)
              .then(() => {
                const plane = this.babylonService.imageContainer.plane;
                if (plane) {
                  console.log('plane', plane);
                  this.Subjects.actualMediaType.next('image');
                  this.updateActiveEntity(newEntity);
                  this.updateActiveEntityMeshes([plane as Mesh]);
                }
              })
                .catch(error => {
                  console.error(error);
                  /*this.message.error(
                  'Connection to entity server to load entity refused.',
                  );*/
                  this.loadFallbackEntity()
                      .then(() => {
                        // TODO add annotation
                      })
                      .catch(e => {
                        console.error(e);
                        // tslint:disable-next-line:max-line-length
                        this.message.error('Loading of Objects does not work. Please tell us about it!');
                      });
                });
            break;
          case 'audio':
            await this.babylonService
              .loadEntity(
                true,
                'assets/models/kompakkt.babylon',
                'model',
                '.babylon',
                true,
              )
              .then(() => {
                this.updateActiveEntityMeshes(this.babylonService
                  .entityContainer.meshes as Mesh[]);
                this.Subjects.actualMediaType.next('audio');
                this.updateActiveEntity(newEntity);

                this.babylonService
                  .loadEntity(false, _url, mediaType)
                  .then(() => {});
              })
                .catch(error => {
                  console.error(error);
                  /*this.message.error(
                  'Connection to entity server to load entity refused.',
                  );*/
                  this.loadFallbackEntity()
                      .then(() => {
                        // TODO add annotation
                      })
                      .catch(e => {
                        console.error(e);
                        // tslint:disable-next-line:max-line-length
                        this.message.error('Loading of Objects does not work. Please tell us about it!');
                      });
                });
            break;
          case 'video':
            await this.babylonService
              .loadEntity(true, _url, mediaType)
              .then(() => {
                const plane = this.babylonService.videoContainer.plane;
                if (plane) {
                  this.Subjects.actualMediaType.next('video');
                  this.updateActiveEntity(newEntity);
                  this.updateActiveEntityMeshes([plane as Mesh]);
                }
              })
                .catch(error => {
                  console.error(error);
                  /*this.message.error(
                  'Connection to entity server to load entity refused.',
                  );*/
                  this.loadFallbackEntity()
                      .then(() => {
                        // TODO add annotation
                      })
                      .catch(e => {
                        console.error(e);
                        // tslint:disable-next-line:max-line-length
                        this.message.error('Loading of Objects does not work. Please tell us about it!');
                      });
                });
            break;
          default:
            this.loadFallbackEntity()
                .then(() => {
                  // TODO add annotation
                })
                .catch(e => {
                  console.error(e);
                  // tslint:disable-next-line:max-line-length
                  this.message.error('Loading of Objects does not work. Please tell us about it!');
                });
        }
      } else {
        this.Subjects.actualEntity.next(newEntity);
        this.loadFallbackEntity()
            .then(() => {
              // TODO add annotation
            })
            .catch(e => {
              console.error(e);
              // tslint:disable-next-line:max-line-length
              this.message.error('Loading of Objects does not work. Please tell us about it!');
            });
        return;
      }
    }
  }

  public updateEntityQuality(quality: string) {
    if (this.quality !== quality) {
      this.quality = quality;
      const entity = this.getCurrentEntity();

      if (!entity || !entity.processed) {
        // tslint:disable-next-line:max-line-length
        this.message.error('The object is not available and unfortunately I can not update the quality.');
        return;
      }
      if (entity && entity.processed[this.quality] !== undefined) {
        if (entity._id === 'Cube' || entity._id === 'fallback') {
          return;
        }
        this.loaded.emit(false);
        this.loadEntity(entity)
            .then(() => {
              this.loaded.emit(true);
            })
            .catch(error => {
              console.error(error);
              this.message.error('Loading of this Quality is not possible');
            });
      } else {
        this.message.error('Entity quality is not available.');
      }
    } else {
      return;
    }
  }

  /*
   * Down here only relevant for full load / catalogue
   */

  // TODO message
  public fetchCollectionsData() {
    this.mongoHandlerService
      .getAllCompilations()
      .then(compilation => {
        this.Subjects.collections.next(compilation);
      })
      .catch(error => {
        console.error(error);
        this.message.error('Connection to entity server refused.');
      });
  }

  // TODO message
  public fetchEntitiesData() {
    this.mongoHandlerService
      .getAllEntities()
      .then(entities => {
        const entitiesforBrowser: IEntity[] = [];

        entities
          .filter(entity => entity)
          .forEach((entity: IEntity) => {
            if (entity.finished) {
              entitiesforBrowser.push(entity);
            }
          });
        this.Subjects.entities.next(entitiesforBrowser);
      })
      .catch(error => {
        console.error(error);
        this.message.error('Connection to entity server refused.');
      });
  }

  // TODO message
  public async selectCollectionByID(
    identifierCollection: string,
  ): Promise<string> {
    // Check if collection has been initially loaded and is available in collections
    const collection: ICompilation | null = this.Observables.collections.source[
      'value'
    ].find(i => i._id === identifierCollection);

    return new Promise((resolve, reject) => {
      if (!collection) {
        // If collection has not been loaded during initial load
        // try to find it on the server
        this.mongoHandlerService
          .getCompilation(identifierCollection)
          .then(compilation => {
            console.log('die compi ist', compilation);
            // collection is available on server
            if (compilation['_id']) {
              // TODO: add to Subjects?
              this.fetchAndLoad(undefined, compilation._id, undefined);
              resolve('loaded');
            } else if (
              compilation['status'] === 'ok' &&
              compilation['message'] === 'Password protected compilation'
            ) {
              resolve('password');
            } else {
              // collection ist nicht erreichbar
              resolve('missing');
            }
          })
          .catch(error => {
            console.error(error);
            this.message.error('Connection to entity server refused.');
            reject('missing');
          });
      } else {
        // collection is available in collections and will be loaded
        this.fetchAndLoad(undefined, collection._id, undefined);
        return 'loaded';
      }
    });
  }

  // TODO message
  public selectEntityByID(identifierEntity: string): boolean {
    // TODO: check if this correctly returns
    const entity = this.Observables.entities.source['value'].find(
      i => i._id === identifierEntity,
    );
    if (entity === undefined) {
      this.mongoHandlerService
        .getEntity(identifierEntity)
        .then(actualEntity => {
          if (actualEntity['_id']) {
            this.Subjects.entities.next([actualEntity]);
            this.fetchAndLoad(actualEntity._id, undefined, false);
            return true;
          }
          return false;
        })
        .catch(error => {
          console.error(error);
          this.message.error('Connection to entity server refused.');
          return false;
        });
    }
    this.fetchAndLoad(entity._id, undefined, false);

    return true;
  }
}
