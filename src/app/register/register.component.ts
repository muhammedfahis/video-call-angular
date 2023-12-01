import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../shared/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  constructor(private userService:UserService,
    private router:Router) { }

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      name: new FormControl("", Validators.required),
      email: new FormControl("",Validators.required),
      password: new FormControl("",Validators.required),
    });
  }
  onSubmitForm(form:FormGroup) {
    let data = this.registerForm.value;
    this.userService.register(data)
    .subscribe(
      (res:any) => {
        if(res.body.success) {
          this.router.navigate([''])
        }
      }
    )

  }

}
