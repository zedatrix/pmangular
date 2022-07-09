import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient, private authService: AuthService) { }

  getUsers() {
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/users', {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    });
  }

  getUserTask(taskId: number) {
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks/'+ taskId, {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    });
  }

  getUserRequest(requestId: number) {
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/requests/'+ requestId + '?include=data', {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    });
  }

  getUserTasks(page: number = 1, filter: string = '', sortBy: string = 'id', sortOrder: string = 'asc') {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    };
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks?page='+ page +'&filter='+ filter +'&sortBy='+ sortBy +'&order_direction='+ sortOrder, httpOptions);
  }

  getProcesses() {
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/processes', {
      headers: new HttpHeaders({
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    });
  }

}
