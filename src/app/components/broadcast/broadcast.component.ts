import {Component, OnInit} from '@angular/core';

import {SocketService} from '../../services/socket/socket.service';

@Component({
  selector: 'app-broadcast',
  templateUrl: './broadcast.component.html',
  styleUrls: ['./broadcast.component.scss'],
})
export class BroadcastComponent implements OnInit {

  constructor(public socketService: SocketService) {
  }

  ngOnInit() {
  }

  public selectedUser(selected: any) {
    console.log('AUSGEWÄHLT', selected);
    this.socketService.sortUser(selected);
  }
}
