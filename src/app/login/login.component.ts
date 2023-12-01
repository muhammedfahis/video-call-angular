import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../shared/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  constructor(private userService:UserService,
    private router:Router) { }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl("",Validators.required),
      password: new FormControl("",Validators.required),
    });
  }

  onSubmitForm(form:FormGroup) {
    let data = this.loginForm.value;
    this.userService.login(data)
    .subscribe(
      (res:any) => {
        if(res.body.success) {
          this.router.navigate(['/home'])
        }
      }
    )
  }

}
