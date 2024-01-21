import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { SocketService } from '../shared/services/socket.service';
import { UserService } from '../shared/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { io } from 'socket.io-client';

import Peer from 'peerjs';


interface VideoElement {
  muted: boolean;
  srcObject: MediaStream;
  userId: string | null;
  name: string;
}
declare var $: any;

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewInit, OnDestroy {

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
  peerList: string[] = [];
  call: any;
  currentPeer: any;
  currentPeerId!: string
  iceServers: any;
  creater!: boolean;
  userStream: any;
  rtcPeerConnection!: RTCPeerConnection;
  audioTrack: any;
  mediaTrack: any;
  rtpAudioSenders: any = [];
  rtpVideoSenders: any = [];
  users_connection: any[] = [];
  remoteStream: any = [];
  audioStream: any = [];
  users_connectionID: any = [];
  answers: any[] = []
  connectedUsers: any = [];
  @ViewChild('localStream') localVideoStream!: ElementRef<HTMLVideoElement>;
  constructor(private socketService: SocketService, private userService: UserService, private route: ActivatedRoute, private router: Router, private renderer: Renderer2) {
    this.route.params.subscribe(params => {
      // Retrieve the 'id' parameter value
      this.room_id = params['id'];
    });
  }


  @HostListener('window:beforeunload', ['$event'])
  leaveRoom(event: Event) {
    this.socket.emit('userLeaving', { user_id: this.currentUserId, meeting_id: this.room_id });
  }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user_Data') || '{}');
    this.currentUserId = this.user?._id || '';
    this.socket = io('http://18.222.248.59:4000');
    this.initiateVideoCall();
  }
  sdpFunction(data: any, to_connid: any) {
    this.socket.emit('sdpProcess', {
      message: data,
      to_connid: to_connid
    })
  }
  ngAfterViewInit() {

  }
  initiateVideoCall() {
    // this.socket = this.socketService.getSocket();
    this.iceServers = this.socketService.getIceServers();
    this.socket.on('connect', () => {
      if (this.socket.connected) {
        this.socket.emit('users_info_to_signaling_server', {
          current_user_id: this.currentUserId,
          current_user_name: this.user.name,
          meeting_id: this.room_id
        });
      }

      this.processMedia()
    }
    )

    this.socket.on('other_users_to_inform', (data: any) => {
      this.addUser(data.other_user_name, data.connId, data.other_user_id);
      this.createConnection(data.connId);
    });
    this.socket.on('newConnectionInformation', (other_users: any) => {
      $('#video-grid .other').remove()
      for (let i = 0; i < other_users.length; i++) {
        this.addUser(other_users[i].user_name, other_users[i].connectionID, other_users[i].user_id);
        this.createConnection(other_users[i].connectionID);
      }
    });
    this.socket.on('sdpProcess', async (data: any) => {
      await this.sdpProcess(data.message, data.from_connid)
    });
    this.socket.on('message',(data:any) => {
      this.messages.push(data);
    })
    this.socket.on('userDisconnected', (data: any) => {
      console.log('User disconnected:', data.disconnectedUserId);
      // Call a function to remove the video and audio elements
      this.removeUser(data.disconnectedUserId);
    });

  }

  addUser(other_user_name: any, connId: any, user_id: any) {
    const existingUser = this.connectedUsers.filter((user: any) => user.user_id === user_id);
    if (existingUser.length) {
      existingUser.forEach((user: any) => {
        $('#video-grid #' + user.connId).remove()
      })

    } else {
      this.connectedUsers.push({ user_id: user_id, connId: connId });
    }
    $('#video-grid').append(`

    <div id="`+ connId + `" class="remote-user other div-center-column">
        <h5 class="div-center" style="color:red;margin:0">`+ other_user_name + `</h5>
        <div class="div-center">
            <video class="single-video" style="width:300px;-moz-transform: rotateY(180deg); -webkit-transform: rotateY(180deg);transform: rotateY(180deg);object-fit: cover;margin: 0.5rem;height:300px;border-radius:1rem;" autoplay id="video_`+ connId + `"></video>
            <audio autoplay id="audio_`+ connId + `"/>
        </div>
    </div>
    
    `)
  }
  async sdpProcess(msg: any, from_connid: any) {

    let message = JSON.parse(msg);

    if (message.answer) {
      this.answers.push(message.answer)
      await this.users_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.offer) {
      if (!this.users_connection[from_connid]) {
        await this.createConnection(from_connid)
      }
      await this.users_connection[from_connid].setRemoteDescription(new RTCSessionDescription(message.offer));
      let answer = await this.users_connection[from_connid].createAnswer();
      await this.users_connection[from_connid].setLocalDescription(answer);
      this.sdpFunction(JSON.stringify({
        "answer": answer
      }), from_connid)
    } else if (message.iceCandidate) {
      if (!this.users_connection[from_connid]) {
        await this.createConnection(from_connid)
      }
      try {
        if (this.users_connection[from_connid].remoteDescription) {
          await this.users_connection[from_connid].addIceCandidate(message.iceCandidate)
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
  async createConnection(connId: any) {
    console.log('createConnection');

    var connection = new RTCPeerConnection(this.iceServers);
    connection.onnegotiationneeded = async (event) => {
      await this.createOffer(connId)
    }
    connection.onicecandidate = (event: any) => {

      if (event.candidate) {
        this.sdpFunction(JSON.stringify({
          'iceCandidate': event.candidate
        }), connId)
      }
    }
    connection.ontrack = (event) => {

      if (!this.remoteStream[connId]) {
        this.remoteStream[connId] = new MediaStream()
      }
      if (!this.audioStream[connId]) {
        this.audioStream[connId] = new MediaStream()
      }
      if (event.track.kind === 'video') {
        this.remoteStream[connId].getTracks().forEach((t: any) => this.remoteStream[connId].removeTrack(t));
        this.remoteStream[connId].addTrack(event.track);
        let remoteVideoDiv: any = document.getElementById('video_' + connId);

        remoteVideoDiv.srcObject = null;
        remoteVideoDiv.srcObject = this.remoteStream[connId];
        remoteVideoDiv.load()
      } else if (event.track.kind === 'audio') {
        this.audioStream[connId].getTracks().forEach((t: any) => this.audioStream[connId].removeTrack(t));
        this.audioStream[connId].addTrack(event.track);
        let remoteAudioDiv: any = document.getElementById('audio_' + connId);
        remoteAudioDiv.srcObject = null;
        remoteAudioDiv.srcObject = this.audioStream[connId];
        remoteAudioDiv.load()
      }
    }

    this.users_connectionID[connId] = connId;
    this.users_connection[connId] = connection;
    this.updateMediaSenders(this.mediaTrack, this.rtpVideoSenders);

    return connection
  }
  async createOffer(connId: any) {
    var connection = this.users_connection[connId];
    var offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    this.sdpFunction(JSON.stringify({
      'offer': connection.localDescription
    }), connId)

  }

  async processMedia() {
    try {
      let vStream: any = null;
      let aStream: any = null;
      vStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 720,
          height: 480
        },
        audio: false
      });
      aStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
      this.audioTrack = aStream?.getAudioTracks()[0];
      this.audioTrack.enable = true;
      this.updateMediaSenders(this.audioTrack, this.rtpAudioSenders);

      this.mediaTrack = vStream.getVideoTracks()[0];
      const videoElement = this.localVideoStream.nativeElement;
      videoElement.srcObject = new MediaStream([this.mediaTrack])
      this.updateMediaSenders(this.mediaTrack, this.rtpVideoSenders);
    } catch (error) {
      console.log(error);
    }
  }
  updateMediaSenders(track: any, rtpSenders: any) {
    for (let con_id in this.users_connection) {
      let connections = this.users_connection[con_id];
      if (connections && (connections.connectionState === 'new' ||
        connections.connectionState === 'connecting' ||
        connections.connectionState === 'connected')) {
        if (track) {
          if (rtpSenders[con_id] && rtpSenders[con_id].track) {
            rtpSenders[con_id].replaceTrack(track)
          } else {
            rtpSenders[con_id] = this.users_connection[con_id].addTrack(track)
          }
        }

      }

    }

  }

  removeUser(disconnectedUserId: any) {
    console.log('inside ');

    const connId = this.users_connection[disconnectedUserId];
    if (connId) {
      console.log('inside if');

      // Remove video and audio elements from the DOM
      const videoElement = document.getElementById('video_' + disconnectedUserId);
      const audioElement = document.getElementById('audio_' + disconnectedUserId);
      const divElement = document.getElementById(disconnectedUserId);

      if (videoElement) {
        videoElement.remove();
      }
      if (divElement) {
        divElement.remove();
      }

      if (audioElement) {
        audioElement.remove();
      }

      // Remove the connection object from the local storage
      delete this.users_connection[disconnectedUserId];
      delete this.users_connectionID[disconnectedUserId];
    }
  }


  getStyle(id: string) {
    if (this.currentUserId === id) {
      return {
        'background': 'green',
        'justify-content': 'start'
      };
    } else {
      return {
        'background': 'yellow',
        'justify-content': 'end'
      };
    }
  }
  getNameStyle(id:string) {
    if (this.currentUserId === id) {
      return {
        'text-align': 'end',
        'margin-right': '3%'
      };
    } else {
      return {
        'text-align': 'start',
        'margin-left': '2%'
      };
    }
  }
  private stopMediaTracks(): void {

    if (this.audioTrack) {
      this.audioTrack.stop();
      this.audioTrack = null;
    }

    if (this.mediaTrack) {
      this.mediaTrack.stop();
      this.mediaTrack = null;
    }
  }
  onLeaveRoom() {
    this.socket.emit('userLeaving', { user_id: this.currentUserId, meeting_id: this.room_id });
    this.stopMediaTracks();
    this.router.navigate(['home'])
  }
  async onScreenShare() {

    const screenStream: any = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });

    // Assuming you have separate video elements for webcam and screen sharing
    const screenVideoElement = this.localVideoStream.nativeElement;
    screenVideoElement.srcObject = screenStream;

    // Add the screen-sharing track to the media senders
    const screenTrack = screenStream.getVideoTracks()[0];
    this.updateMediaSenders(screenTrack, this.rtpVideoSenders);
  }
  onSendMessage() {
    this.socket.emit('message',{
      from_user_id: this.currentUserId,
      from_user_name:this.user.name,
      message: this.message,
      room:this.room_id
    });
    this.message = '';
  }
  ngOnDestroy(): void {
    this.socket.emit('userLeaving', { user_id: this.currentUserId, meeting_id: this.room_id });
    this.stopMediaTracks();
  }
}
