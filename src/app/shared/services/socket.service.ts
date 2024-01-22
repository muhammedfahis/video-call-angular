import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: any;
  private icServers:any;
  public peerConnections:any[] = []

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // this.socket = io('https://video.evara.tk'); 
    // this.socket = io('http://localhost:4000'); 
    this.icServers =  {
      'iceServers':[
        {"url":'stun:stun.l.google.com:19302'},
        {"url":'stun:stun3.l.google.com:19302'},
        {"url":'stun:stun4.l.google.com:19302'},
        {"url":'stun:stun2.l.google.com:19302'},
    ]
  }
    
  }

  getIceServers() {
    return this.icServers;
  }
 
  getSocket(): any{
    return this.socket;
  }

  
  addPeer(peerId:string) {
    this.peerConnections.push(peerId)
  }
  isPeerExists(peerId:string) {
    return this.peerConnections.includes(peerId)
  }
  // Emit an event
  public sendMessage(message: string): void {
    this.socket.emit('message', message);
  }

  // Listen to an event
  public onNewMessage(): Observable<string> {
    return new Observable<string>(observer => {
      this.socket.on('new-message', (data: string) => {
        observer.next(data);
      });
    });
  }
}
