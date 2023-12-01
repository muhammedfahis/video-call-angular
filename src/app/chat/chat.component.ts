import { Component, OnInit } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ActivatedRoute } from '@angular/router';
import Peer from 'peerjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  videoGrid:any;
  myVideoStream:any;
  socket:any;
  room_id:any;
  peer:any;
  constructor(private socketService: SocketService, private userService: UserService,private route:ActivatedRoute) { 
    this.route.params.subscribe(params => {
      // Retrieve the 'id' parameter value
      this.room_id = params['id'];
    });
  }

  ngOnInit(): void {
    this.socket =  this.socketService.getSocket();
    this.peer = this.socketService.getPeer();
    this.videoGrid = document.getElementById("video-grid");
    const myVideo = document.createElement("video");
    myVideo.muted = true;
    navigator.mediaDevices?.getUserMedia({
      audio: true,
      video: true,
    })
      .then((stream) => {
        this.myVideoStream = stream;
        this.addVideoStream(myVideo, stream);
       this.peer.on('call', (call:any) => {
        console.log('on call peer');
        
          call.answer(stream);
          const video = document.createElement('video');
          call.on('stream', (userVideoStream:any) => {
            console.log('call on stream');
            
          this.addVideoStream(video, userVideoStream);
          });
        });
        this.socket.on('user-connected', (userId:any) => {
          console.log('on user-connected')
          this.connectToNewUser(userId, stream);
          });
      });
      this.peer.on('open', (id:any) => {
        console.log('on peer open')
        this.socket.emit('join-room', this.room_id, id);
        });

  }
   addVideoStream (video:any, stream:any)  {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
       video.play();
       this.videoGrid.append(video);
    });
};
 connectToNewUser (userId:any, stream:any) {
  const call = this.peer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream:any) => {
  this.addVideoStream(video, userVideoStream);
  });
 }

}
