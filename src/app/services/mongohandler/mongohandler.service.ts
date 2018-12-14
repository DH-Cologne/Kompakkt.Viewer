import {Injectable} from '@angular/core';
import {environment} from '../../../environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MongohandlerService {

  private endpoint = `${environment.express_server_url}:${environment.express_server_port}`;
  private headers: HttpHeaders;

  constructor(private http: HttpClient) {

    this.headers = new HttpHeaders();
    this.headers.set('Content-Type', 'application/json');
  }

  public getCompilation(identifier: string): Observable<any> {
    return this.http.get<any>(this.endpoint + '/api/v1/get/find/compilation/' + identifier, {headers: this.headers});
  }

  public updateScreenshot(identifier: string, screenshot: string): Observable<any> {
    return this.http.post<any>(this.endpoint + '/api/v1/post/screenshot/' + identifier, {data: screenshot});
  }

  /* Funktionen aus ObjectsRepository, nur zum Vergleich
    private findSingleInCollection(collection: Collection, identifier: string): Observable<Person | Institute | Tag> {
      return this.http.get<Person | Institute>(`${this.endpoint}/api/v1/get/find/${collection}/${identifier}`);
    }

    public findAllInCollection(collection: Collection): Observable<Person[] | Institute[] | Tag[]> {
      return this.http.get<Person[] | Institute[]>(`${this.endpoint}/api/v1/get/findall/${collection}`);
    }

    public submitToDB(SubmitObject: any): Observable<any> {
      return this.http.post(`${this.endpoint}/api/v1/post/submit`, SubmitObject);
    }
  */
}
