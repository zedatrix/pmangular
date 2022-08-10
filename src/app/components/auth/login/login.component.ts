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
      instance: ['demojc-se.processmaker.net', Validators.required],
      clientId: ['11', Validators.required],
      clientSecret: ['kERirlyY1G4tK0pzG7dtYLmqzJtGc72ARBN4joZZ', Validators.required],
      username: ['admin', Validators.required],
      password: ['p4ssw0rdJC!', Validators.required]
    });
  }

  ngOnInit(): void {}

  login(formData: UserAuth): void {
    this.authService.login(formData);
  }
}
