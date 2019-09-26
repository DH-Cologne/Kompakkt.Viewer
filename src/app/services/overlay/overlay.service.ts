import { EventEmitter, Injectable, Output } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {
  public sidenavIsOpen = false;
  public isInitialSettingsMode = false;
  public actualSidenavMode = '';
  private Subjects = {
    mode: new ReplaySubject<string>(),
  };
  public Observables = {
    mode: this.Subjects.mode.asObservable(),
  };

  @Output() sidenav: EventEmitter<boolean> = new EventEmitter();
  @Output() initialSettingsmode: EventEmitter<boolean> = new EventEmitter();

  public toggleSidenav(
    mode: string,
    open?: boolean,
    initial?: boolean,
  ): boolean {
    console.log('MODE INITIAL SETTINGS: ', initial, this.isInitialSettingsMode);
    if (initial === true) {
      this.isInitialSettingsMode = true;
      this.initialSettingsmode.emit(true);
    }
    if (initial === false) {
      this.isInitialSettingsMode = false;
      this.initialSettingsmode.emit(false);
    }
    if (this.actualSidenavMode === mode && this.sidenavIsOpen) {
      if (open) {
        return true;
      }
      this.sidenavIsOpen = false;
      this.sidenav.emit(false);
      return false;
    }
    if (this.actualSidenavMode === mode && !this.sidenavIsOpen) {
      this.sidenavIsOpen = true;
      this.sidenav.emit(true);
      return true;
    }
    if (this.actualSidenavMode !== mode && this.sidenavIsOpen) {
      this.sidenavIsOpen = false;
      this.sidenav.emit(false);
      this.actualSidenavMode = mode;
      this.Subjects.mode.next(mode);
      setTimeout(() => {
        this.sidenavIsOpen = true;
        this.sidenav.emit(true);
      }, 300);
      return true;
    }
    if (this.actualSidenavMode !== mode && !this.sidenavIsOpen) {
      this.actualSidenavMode = mode;
      this.Subjects.mode.next(mode);
      this.sidenavIsOpen = true;
      this.sidenav.emit(true);
      return true;
    }
    return false;
  }
}
