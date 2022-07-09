import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserAuth } from 'src/app/models/userAuth';

import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginForm: FormGroup;

  constructor(public authService: AuthService, private formBuilder: FormBuilder) {
    this.loginForm = this.formBuilder.group({
      instance: ['', Validators.required],
      clientId: ['', Validators.required],
      clientSecret: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  login(formData: UserAuth): void {
    this.authService.login(formData);
  }
}
