import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuth } from 'src/app/models/userAuth';

import { UserAuthResponse } from 'src/app/models/userAuthResponse';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public apiUrl: string;
  public authenticated: boolean;
  public authenticatedUserToken: string;
  private authenticatedUserRefreshToken: string;
  private authenticatedUserTokenExpiry: number;

  constructor(private httpClient: HttpClient, private router: Router) { }

  checkAuthStatus() {}

  login(formData: UserAuth){
    this.httpClient.post(
      environment.apiProtocol + formData.instance + '/oauth/token',
      {
        client_id: formData.clientId,
        client_secret: formData.clientSecret,
        username: formData.username,
        password: formData.password,
        grant_type: 'password'
    }
    ).subscribe((response: UserAuthResponse) => {
      this.apiUrl = environment.apiProtocol + formData.instance;
      let currentDateTime = +new Date();
      this.authenticated = true;
      this.authenticatedUserToken = response.access_token;
      this.authenticatedUserRefreshToken = response.refresh_token;
      this.authenticatedUserTokenExpiry = currentDateTime + response.expires_in;
      this.router.navigateByUrl('/');
    });
  }

  logout() {
    this.apiUrl = null;
    this.authenticated = false;
    this.authenticatedUserToken = null;
    this.authenticatedUserRefreshToken = null;
    this.authenticatedUserTokenExpiry = null;
    this.router.navigateByUrl('login');
  }

}
