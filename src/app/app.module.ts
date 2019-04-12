// tslint:disable:max-line-length
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <-- NgModel lives here
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatDialogModule,
  MatDividerModule, MatExpansionModule, MatFormFieldModule, MatIconModule,
  MatInputModule, MatListModule, MatMenuModule, MatProgressSpinnerModule,
  MatRadioModule, MatSelectModule, MatSliderModule, MatSlideToggleModule,
  MatSnackBarModule, MatStepperModule, MatTabsModule, MatTooltipModule,
} from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ColorChromeModule } from 'ngx-color/chrome';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { AnnotationComponent } from './components/annotation/annotation.component';
import { AnnotationcardsComponent } from './components/annotationcards/annotationcards.component';
import { AnnotationsEditorComponent } from './components/annotations-editor/annotations-editor.component';
import { AnnotationwalkthroughComponent } from './components/annotationwalkthrough/annotationwalkthrough.component';
import { CollectionsOverviewComponent } from './components/collections-overview/collections-overview.component';
import { DialogDeleteAnnotationsComponent } from './components/dialogs/dialog-delete-annotations/dialog-delete-annotations.component';
import { LoginComponent } from './components/dialogs/dialog-login/login.component';
import { DialogMeshsettingsComponent } from './components/dialogs/dialog-meshsettings/dialog-meshsettings.component';
import { EditorComponent } from './components/editor/editor.component';
import { LoadingscreenComponent } from './components/loadingscreen/loadingscreen.component';
import { MenuComponent } from './components/menu/menu.component';
import { MetadataComponent } from './components/metadata/metadata.component';
import { ModelComponent } from './components/model/model.component';
import { ModelsettingsComponent } from './components/modelsettings/modelsettings.component';
import { PasswordComponent } from './components/password/password.component';
import { SceneComponent } from './components/scene/scene.component';
import {DialogAnnotationEditorComponent} from './components/dialogs/dialog-annotation-editor/dialog-annotation-editor.component';
import {MediaTypePipe} from './pipes/media-type.pipe';
import {MarkdownModule} from 'ngx-markdown';
// tslint:enable:max-line-length

@NgModule({
  declarations: [
    AppComponent,
    SceneComponent,
    MenuComponent,
    EditorComponent,
    AnnotationsEditorComponent,
    AnnotationComponent,
    AnnotationcardsComponent,
    AnnotationwalkthroughComponent,
    ModelComponent,
    CollectionsOverviewComponent,
    LoadingscreenComponent,
    MetadataComponent,
    ModelsettingsComponent,
    LoginComponent,
    PasswordComponent,
    DialogDeleteAnnotationsComponent,
    DialogMeshsettingsComponent,
    DialogAnnotationEditorComponent,
    MediaTypePipe,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
    MatTabsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatListModule,
    MatDividerModule,
    HttpClientModule,
    DragDropModule,
    DeviceDetectorModule.forRoot(),
    ColorChromeModule,
    MatSliderModule,
    MatRadioModule,
    MatSelectModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    SocketIoModule.forRoot({
      url: `${environment.express_server_url}:${environment.express_server_port}`,
    }),
    MarkdownModule.forRoot(),
  ],
  entryComponents: [
    LoginComponent,
    PasswordComponent,
    DialogDeleteAnnotationsComponent,
    DialogMeshsettingsComponent,
    DialogAnnotationEditorComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
}
