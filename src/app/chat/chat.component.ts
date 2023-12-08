import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
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
export class ChatComponent implements OnInit,AfterViewInit,OnDestroy {
  videoGrid:any;
  myVideoStream:any;
  socket:any;
  room_id:any;
  peer:any;
  joined:boolean = false;
  peerId: any;
  user:any;
  videos: VideoElement[] = [];
  currentUserId: string = ''
  message:string = '';
  messages:any[] = [];
  constructor(private socketService: SocketService, private userService: UserService,private route:ActivatedRoute,private router:Router) { 
    this.route.params.subscribe(params => {
      // Retrieve the 'id' parameter value
      this.room_id = params['id'];
    });
  }

  ngOnInit(): void {
    let user_Data:any = localStorage.getItem('user_Data')
    this.user = JSON.parse(user_Data);
    this.currentUserId = this.user._id;

    
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
      this.socket.emit('join-room', this.room_id,id,this.currentUserId,this.user.name);
    });  
    navigator.mediaDevices?.getUserMedia({
      audio: true,
      video: true,
    })
      .catch(err => console.log(err)
      )
      .then((stream:any) => {
        this.myVideoStream = stream;
        this.addMyVideo(stream);
        this.socket.on('user-connected', (peerId:any,userId:any) => {
          this.connectToNewUser(peerId, this.myVideoStream);
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
            this.addOtherUserVideo(call.metadata.userId, remoteStream);
          }); 
        })
      });
      this.socket.on('createMessage',(message:any,user:any) => {
        this.messages.push({
          user,
          message
        })
        this.message = '';
      })
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
onClickSendMessage() {
  this.socket.emit('message', this.message);
}

getStyle(id:string) {
  console.log(this.currentUserId,id,'ids');
  
  if (this.currentUserId === id) {
    return {
      'background': 'green',
      'justify-content': 'start'
    };
  } else {
    return  {
      'background': 'yellow',
      'justify-content': 'end'
    };
  }
}
onClickExit() {
  this.socket.emit('leave-room', this.room_id, this.currentUserId);
  this.videos = this.videos.filter(video => video.userId !== this.currentUserId)
  this.router.navigate(['home']);
}
ngOnDestroy(): void {
  if (this.myVideoStream) {
    const tracks = this.myVideoStream.getTracks();
    tracks.forEach((track:any) => {
      track.stop(); // Stop each track
    });
    this.myVideoStream = null;
  }
}

}
