import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Peer from 'peerjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private socket: any;
  private peer!: Peer;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.socket = io('https://video-call-nodejs-seven.vercel.app/'); 
    this.peer = new Peer(
      {
        host: 'https://video-call-nodejs-seven.vercel.app/',
        port: 4000,
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
  }
 
  getSocket(): any{
    return this.socket;
  }

  getPeer(): Peer {
    return this.peer;
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

  public createNewRoom() {

  }
}
