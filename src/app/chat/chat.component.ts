import { AfterViewInit, Component, OnInit } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ActivatedRoute } from '@angular/router';
import Peer from 'peerjs';

interface VideoElement {
  muted: boolean;
  srcObject: MediaStream;
  userId: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit,AfterViewInit {
  videoGrid:any;
  myVideoStream:any;
  socket:any;
  room_id:any;
  peer:any;
  joined:boolean = false;
  peerId: any;
  videos: VideoElement[] = [];
  currentUserId: string = ''
  constructor(private socketService: SocketService, private userService: UserService,private route:ActivatedRoute) { 
    this.route.params.subscribe(params => {
      // Retrieve the 'id' parameter value
      this.room_id = params['id'];
    });
  }

  ngOnInit(): void {
    let user_Data:any = localStorage.getItem('user_Data')
    let user = JSON.parse(user_Data);
    this.currentUserId = user._id
    
    this.initiateVideoCall();
  }
  ngAfterViewInit() {
    
  }
   getUniqueId(parts: number): string {
    const stringArr = [];
    for(let i = 0; i< parts; i++){
      // tslint:disable-next-line:no-bitwise
      const S4 = (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      stringArr.push(S4);
    }
    return stringArr.join('-');
  }
  initiateVideoCall() {
    this.socket =  this.socketService.getSocket();
    this.peer = new Peer(
      {
        host: 'video.evara.tk',
        path: '/peerjs',
        config: {
          'iceServers': [
            { url: 'stun:stun01.sipphone.com' },
            { url: 'stun:stun.ekiga.net' },
            { url: 'stun:stunserver.org' },
            { url: 'stun:stun.softjoys.com' },
            { url: 'stun:stun.voiparound.com' },
            { url: 'stun:stun.voipbuster.com' },
            { url: 'stun:stun.voipstunt.com' },
            { url: 'stun:stun.voxgratia.org' },
            { url: 'stun:stun.xten.com' },
            {
              url: 'turn:192.158.29.39:3478?transport=udp',
              credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
              username: '28224511:1379330808'
            },
            {
              url: 'turn:192.158.29.39:3478?transport=tcp',
              credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
              username: '28224511:1379330808'
            }
          ]
        },
      
        debug: 3
      }
    )
    this.peer.on('open', (id:any) => {
      this.socket.emit('join-room', this.room_id, id);
    });  
    this.videoGrid = document.getElementById("video-grid");
    const myVideo = document.createElement("video");
    myVideo.muted = true;
    navigator.mediaDevices?.getUserMedia({
      audio: true,
      video: true,
    })
      .catch(err => console.log(err)
      )
      .then((stream:any) => {
        this.myVideoStream = stream;
        this.addMyVideo(stream);
        // this.addVideoStream(myVideo, stream);
        // this.peer.on('call', (call:any) => {      
        //   call.answer(this.myVideoStream);
        //   const video = document.createElement('video');
        //   call.on('stream', (userVideoStream:any) => {
        //   this.addVideoStream(video, userVideoStream);
        //   });
        // });
        this.socket.on('user-connected', (userId:any) => {
          this.connectToNewUser(userId, this.myVideoStream);
        });
        this.socket.on('user-disconnected', (userId:any) => {
          console.log(`receiving user-disconnected event from ${userId}`)
          this.videos = this.videos.filter(video => video.userId !== userId);
        });
      }); 
      this.peer.on("call", (call:any) => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          call.answer(stream);
          call.on("stream", (remoteStream:any) => {
            // const video = document.createElement('video');
            // this.addVideoStream(video, remoteStream);
            this.addOtherUserVideo(call.metadata.userId, remoteStream);
          }); 
        })
      });
  }
   addVideoStream (video:any, stream:any)  {
    video.srcObject = stream;
    video.style.width = '300px';
    video.style.height = '300px';
    video.style.border = '1px solid red';
    video.style.marginLeft = '10px';
    video.style.marginRight = '10px';
    video.addEventListener("loadedmetadata", () => {
       video.play();
       this.videoGrid.append(video);
    });
};
 connectToNewUser (userId:any, stream:any) {
  const call = this.peer.call(userId, stream,{
    metadata: { userId: this.currentUserId },
  });
  const video = document.createElement('video');
  video.style.width = '300px';
  video.style.height = '300px';
  video.style.border = '1px solid red';
  video.style.marginLeft = '10px';
  video.style.marginRight = '10px';
  video.setAttribute('id', userId);
  call.on('stream', (userVideoStream:any) => {
    this.addOtherUserVideo(userId, userVideoStream);
  // this.addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    this.videos = this.videos.filter((video) => video.userId !== userId);
  });
 }
 addMyVideo(stream: MediaStream) {
  this.videos.push({
    muted: true,
    srcObject: stream,
    userId: this.currentUserId,
  });
}
addOtherUserVideo(userId: string, stream: MediaStream) {
  const alreadyExisting = this.videos.some(video => video.userId === userId);
  if (alreadyExisting) {
    console.log(this.videos, userId);
    return;
  }
  this.videos.push({
    muted: false,
    srcObject: stream,
    userId,
  });
}

onLoadedMetadata(event: Event) {
  (event.target as HTMLVideoElement).play();
}

}
