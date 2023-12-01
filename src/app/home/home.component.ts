import { Component, OnInit } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  rooms:any[] = [];
  constructor(private socketService:SocketService,private userService:UserService,private router:Router) { }

  ngOnInit(): void {
    this.getRooms();
    this.socketService.sendMessage('hi socket io');
    console.log(this.socketService.onNewMessage());
    
  }

  onCreateNewRoom() {
    this.userService.createNewRoom()
    .subscribe(
      (res:any) => {
       if(res.success) {
        this.router.navigate([`${res.id}`])
       }
      }
    )
  }

  getRooms() {
    this.userService.getRooms()
    .subscribe(
      ((res:any) => {
        if(res.body.success) {
          this.rooms = res.body.data;
        } else {
          this.rooms = [];
        }
      })
    )
  }
  onClickRoom(room:any) {
    this.router.navigate([`${room.room_id}`])
  }

}
