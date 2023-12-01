import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  userUrl = environment.api +'/user'
  constructor(
    private http: HttpClient,
    private router: Router,
  ) { 

  }

  register(data:any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(this.userUrl + '/register',{...data}, { headers, observe: 'response' })
      .pipe(
        tap(resData => {
          console.log(resData,'resData');
          return resData.body
        })
      );
  }
  login(data:any) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(this.userUrl + '/login',{...data},{ headers, observe: 'response' })
      .pipe(
        tap(resData => {
          console.log(resData);
          let data:any = resData.body;
          let userData = data?.userData;
          let token = data.userData.token;
          localStorage.setItem("user_Data", JSON.stringify(userData));
          localStorage.setItem("token", JSON.stringify(token));
          // localStorage.setItem("token", resData?.userData.token)
          
        })
      );
  }

  createNewRoom() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(this.userUrl + '/create-room',{ headers, observe: 'response' })
      .pipe(
        tap(resData => {
          console.log(resData);      
        })
      );
  }
  getRooms() {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.get(this.userUrl + '/rooms',{ headers, observe: 'response' })
      .pipe(
        tap(resData => {
          console.log(resData);      
        })
      );
  }
}
