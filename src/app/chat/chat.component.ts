import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import Peer from 'peerjs';


interface VideoElement {
  muted: boolean;
  srcObject: MediaStream;
  userId: string;
  user: string | null
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit,AfterViewInit,OnDestroy {
  videoGrid: any;
  myVideoStream: MediaStream | null = null;
  socket: any;
  room_id: any;
  peer: Peer | null = null;
  joined = false;
  peerId: any;
  user: any;
  videos: VideoElement[] = [];
  remoteVideoStream: MediaStream | null = null;
  currentUserId = '';
  message = '';
  messages: any[] = [];
  peerList:string[] = [];
  call: any;
  currentPeer:any;
  currentPeerId!:string
  constructor(private socketService: SocketService, private userService: UserService,private route:ActivatedRoute,private router:Router) { 
    this.route.params.subscribe(params => {
      // Retrieve the 'id' parameter value
      this.room_id = params['id'];
    });
  }


  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user_Data') || '{}');
    this.currentUserId = this.user?._id || '';

    this.initiateVideoCall();
  }
  ngAfterViewInit() {
    
  }
  initiateVideoCall() {
    this.socket =  this.socketService.getSocket();
    this.peer = new Peer(
      {
        host: 'video.evara.tk',
        // port:4000,
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
    this.peer?.on('open', (id: any) => {
      this.currentPeerId = id;
      this.socket.emit('join-room', this.room_id, id, this.currentUserId, this.user.name);
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
          this.connectToNewUser(peerId,userId, this.myVideoStream);
        });
        this.socket.on('user-disconnected', (userId:any,peerId:any) => {
          console.log(`receiving user-disconnected event from ${userId}`)
          this.videos = this.videos.filter(video => video.userId !== peerId);
        });
        this.peer?.on('call', (call:any) => {
          this.call = call;   
          call.answer(this.myVideoStream);
          call.on('stream', (otherUserVideoStream: MediaStream) => {
            this.remoteVideoStream = otherUserVideoStream;
            // if(!this.peerList.includes(call.metadata.peerId)){
              this.currentPeer = call.peerConnection;
              this.addOtherUserVideo(call.metadata.peerId,call.metadata.userId,this.remoteVideoStream);
              this.peerList.push(call.metadata.peerId)
            // }
          });
          call.on('error', (err:any) => {
            console.error(err);
          });
          call.on('close', () => {
            console.log(this.videos,call.metadata.userId,'log');
            this.videos = this.videos.filter((video) =>   video.userId !== call.metadata.peerId);
            // this.socket.emit('leave-room', this.room_id,call.metadata.userId ,call.metadata.peerId);
          });
        });
      }); 
      this.socket.on('createMessage',(message:any,user:any) => {
        this.messages.push({
          user,
          message
        })
        this.message = '';
      });
  }
 connectToNewUser (peerId:any,userId:any, stream:any) {
  const call = this.peer?.call(peerId, stream, {
    metadata: { peerId,userId },
  });

  if (!call) return;
  this.call = call;
  const video = document.createElement('video');
  video.style.width = '300px';
  video.style.height = '300px';
  video.style.border = '1px solid red';
  video.style.marginLeft = '10px';
  video.style.marginRight = '10px';
  video.setAttribute('id', peerId);
  call?.on('stream', (userVideoStream:any) => { 
    // if(!this.peerList.includes(peerId)){
      this.currentPeer = call.peerConnection;
      this.addOtherUserVideo(peerId,userId, userVideoStream);
      this.peerList.push(peerId)
    // }
  });
  call.on('close', () => {
    this.videos = this.videos.filter((video) => video.userId !== peerId);
  });
 }
 addMyVideo(stream: MediaStream) {
  const existingUserVideo = this.videos.find(video => video.userId === this.currentPeerId);
  if (!existingUserVideo) {
    this.videos.push({
      muted: true,
      srcObject: stream,
      userId: this.currentPeerId,
      user:this.currentUserId
    });
  }  else {
    existingUserVideo.srcObject = stream;
  }
}
addOtherUserVideo(peerId: string,userId:any, stream: MediaStream) {
  const alreadyExisting = this.videos.find(video => video.userId === peerId);
  if (alreadyExisting) {
    // alreadyExisting.srcObject = stream;
    return;
  }
  this.videos.push({
    muted: true,
    srcObject: stream,
    userId:peerId,
    user:userId
  });
}

onLoadedMetadata(event: Event) {
  (event.target as HTMLVideoElement).play();
}
onClickSendMessage() {
  this.socket.emit('message', this.message);
}

getStyle(id:string) {  
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
  // this.call.close();
  this.socket.emit('leave-room', this.room_id, this.currentUserId);
  this.router.navigate(['home']);
}
shareScreen() {
  navigator.mediaDevices.getDisplayMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true
    },
  })
  .then(stream => {
    let videoTrack:any = stream.getVideoTracks()[0];
    if (!videoTrack) {
      console.error('No video track found in the screen sharing stream');
      return;
    }
    videoTrack.onended = function() {
      this.stopScreenShare();
    }

    let sender = this.currentPeer.getSenders().find((s: any) => {
      return s.track && s.track.kind === videoTrack.kind;
    });

    if (!sender) {
      console.error('No suitable sender found to replace track');
      return;
    }

    sender.replaceTrack(videoTrack)
      .then(() => {
        // Notify the user that screen sharing has started
        console.log('Screen sharing started');
      })
      .catch((err:any) => {
        console.error('Error replacing track:', err);
      });
  })
  .catch(err => {
    console.error('Error accessing screen sharing:', err);
    // Notify the user about the error
  });
}
stopScreenShare() {
  let videoTrack = this.myVideoStream?.getVideoTracks()[0];
  let sender = this.currentPeer.getSenders().find((s:any) => {
    return s.track.kind == videoTrack?.kind
  });
  sender.replaceTrack(videoTrack)
}
ngOnDestroy(): void {
  if (this.myVideoStream) {
    this.myVideoStream.getTracks().forEach(track => {
      track.stop();
      track.enabled = false;
    });
    // this.call?.close();
    this.socket.emit('leave-room', this.room_id, this.currentUserId);
  }
}
}
