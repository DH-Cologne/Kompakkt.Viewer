import {EventEmitter, Injectable, Output} from '@angular/core';
import {Model} from '../../interfaces/model/model.interface';
import {MongohandlerService} from '../mongohandler/mongohandler.service';
import {BehaviorSubject} from 'rxjs';
import {LoadModelService} from '../load-model/load-model.service';
import {MessageService} from '../message/message.service';

@Injectable({
  providedIn: 'root'
})

export class CatalogueService {

  private Subjects = {
    models: new BehaviorSubject<Model[]>(Array<Model>()),
    collections: new BehaviorSubject<any[]>(Array<any>()),
  };

  public Observables = {
    models: this.Subjects.models.asObservable(),
    collections: this.Subjects.collections.asObservable(),
  };

  private isFirstLoad = true;
  public isLoggedIn: boolean;

  @Output() loggedIn: EventEmitter<boolean> = new EventEmitter();

  constructor(private mongohandlerService: MongohandlerService,
              private loadModelService: LoadModelService,
              private message: MessageService) {
  }

  public bootstrap(): void {

    if (this.isFirstLoad) {

      const url_split = location.href.split('?');

      if (url_split.length <= 1) {
        this.isFirstLoad = false;
        this.loadModelService.loadDefaultModelData();

        this.mongohandlerService.isAuthorized().then(result => {
          if (result.status === 'ok') {
            this.fetchCollectionsData();
            this.fetchModelsData();
            this.loadModelService.getUserData();
            this.isLoggedIn = true;
            this.loggedIn.emit(true);
          } else {
            this.isLoggedIn = false;
            this.loggedIn.emit(false);          }
        }).catch(error => {
          this.message.error('Can not see if you are logged in.');
        });

      }

      if (url_split.length > 1) {

        const equal_split = url_split[1].split('=');

        if (equal_split.length > 1) {

          const query = equal_split[1];
          const category = equal_split[0];

          // TODO: Cases for audio, video and image
          switch (category) {
            case 'model':
              this.loadModelService.fetchModelData(query);
              this.isFirstLoad = false;
              this.mongohandlerService.isAuthorized().then(result => {
                if (result.status === 'ok') {
                  this.loadModelService.getUserData();
                  this.isLoggedIn = true;
                  this.loggedIn.emit(true);
                } else {
                  this.isLoggedIn = false;
                  this.loggedIn.emit(false);          }
              }).catch(error => {
                this.message.error('Can not see if you are logged in.');
              });
              break;

            case 'compilation':
              this.isFirstLoad = false;
              this.loadModelService.fetchCollectionData(query);
              this.mongohandlerService.isAuthorized().then(result => {
                if (result.status === 'ok') {
                  this.loadModelService.getUserData();
                  this.isLoggedIn = true;
                  this.loggedIn.emit(true);
                } else {
                  this.isLoggedIn = false;
                  this.loggedIn.emit(false);          }
              }).catch(error => {
                this.message.error('Can not see if you are logged in.');
              });
              break;

            default:
              this.isFirstLoad = false;
              console.log('No valid query passed. Loading default model.');
              this.loadModelService.loadDefaultModelData();
          }
        } else {
          console.log('No valid query passed. Loading default model.');
          this.isFirstLoad = false;
          this.loadModelService.loadDefaultModelData();
        }
      }
    } else {
      console.log('Page has already been initially loaded.');
      this.mongohandlerService.isAuthorized().then(result => {
        if (result.status === 'ok') {
          this.fetchCollectionsData();
          this.fetchModelsData();
          this.loadModelService.getUserData();
          this.isLoggedIn = true;
          this.loggedIn.emit(true);
        } else {
          this.isLoggedIn = false;
          this.loggedIn.emit(false);
        }
      }).catch(error => {
        this.message.error('Can not see if you are logged in.');
      });
    }
  }

  public fetchCollectionsData() {
    this.mongohandlerService.getAllCompilations().then(compilation => {
      this.Subjects.collections.next(compilation);
    }, error => {
      this.message.error('Connection to object server refused.');
    });
  }

  public fetchModelsData() {
    this.mongohandlerService.getAllModels().then(model => {
      this.Subjects.models.next(model);
    }, error => {
      this.message.error('Connection to object server refused.');
    });
  }

  public selectCollection(collection: any) {
    this.loadModelService.updateActiveCollection(collection);
    this.loadModelService.loadSelectedModel(collection.models[0], true);
  }

  public selectModel(model: Model, collection: boolean) {
    this.loadModelService.loadSelectedModel(model, collection);
  }

  /**
   * @function selectCollectionByID looks up a collection by a given identifier
   *
   * @param {string} identifierCollection,
   * @returns {boolean} collection has been found
   */
  public async selectCollectionByID(identifierCollection: string): Promise<any> {
    // Check if collection has been initially loaded and is available in collections
    const collection = this.Observables.collections.source['value'].find(i => i._id === identifierCollection);
    // If collection has not been loaded during initial load
    if (collection === undefined) {
      // try to find it on the server
      return await new Promise((resolve, reject) => {
      this.mongohandlerService.getCompilation(identifierCollection).then(compilation => {
        // collection is available on server
        if (compilation['_id']) {
          this.addAndLoadCollection(compilation);
          resolve('loaded');
        } else if (compilation['status'] === 'ok' && compilation['message'] === 'Password protected compilation') {
          resolve('password');
        } else {
          // collection ist nicht erreichbar
          resolve('missing');
        }
      }, error => {
        this.message.error('Connection to object server refused.');
        reject('missing');
      });
      });
      // collection is available in collections and will be loaded
    } else {
      this.selectCollection(collection);
      return 'loaded';
    }
  }

  public selectModelbyID(identifierModel: string): boolean {
    const model = this.Observables.models.source['value'].find(i => i._id === identifierModel);
    if (model === undefined) {
      this.mongohandlerService.getModel(identifierModel).then(actualModel => {
        if (actualModel['_id']) {
          this.Subjects.models.next(actualModel);
          this.selectModel(actualModel, false);
          return true;
        } else {
          return false;
        }
      }, error => {
        this.message.error('Connection to object server refused.');
        return false;
      });
    }
    this.selectModel(model, false);
    return true;
  }

  public addAndLoadCollection(compilation: any) {
    // add it to collections TODO
    // this.Subjects.collections.next(compilation);
    // load collection
    this.selectCollection(compilation);
  }

}
