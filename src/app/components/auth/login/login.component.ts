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
      instance: ['local.processmaker.com', Validators.required],
      clientId: ['8', Validators.required],
      clientSecret: ['tA6a2iA0CNuTPaevsqwFhZE7lyIhQdnB9AnazblH', Validators.required],
      username: ['admin', Validators.required],
      password: ['chainfire', Validators.required]
    });
  }

  ngOnInit(): void {}

  login(formData: UserAuth): void {
    this.authService.login(formData);
  }
}
