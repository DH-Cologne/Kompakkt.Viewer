import {Component, OnInit} from '@angular/core';
import {LoadingscreenhandlerService} from '../../services/loadingscreenhandler/loadingscreenhandler.service';

@Component({
  selector: 'app-loading-screen',
  templateUrl: './loadingscreen.component.html',
  styleUrls: ['./loadingscreen.component.scss']
})
export class LoadingscreenComponent implements OnInit {

  public logo: string;
  public loadingText = 'Loading...';
  public opacity = '1';
  public backgroundColor = '#111111';
  public style = {
    left: '0px',
    top: '0px',
    width: '100%',
    height: '100%'
  };

  constructor(private loadingScreenHandler: LoadingscreenhandlerService) {
  }

  ngOnInit() {
    this.logo = this.loadingScreenHandler.logo;
    this.backgroundColor = this.loadingScreenHandler.backgroundColor;
    this.loadingScreenHandler.opacity.subscribe((newOpacity) => this.opacity = newOpacity);
    this.loadingScreenHandler.loadingText.subscribe((newText) => this.loadingText = newText);
    this.loadingScreenHandler.loadingStyle.subscribe((newStyle) => this.style = newStyle);
  }

}
