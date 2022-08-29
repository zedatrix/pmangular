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
    //return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks/'+ taskId, {
    //return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks/'+ taskId + '?include=data,user,requestor,processRequest,component,screen,requestData', {
    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks/'+ taskId + '?include=data,user,requestor,screen,requestData', {  
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

  //getUserTasks(page: number = 1, filter: string = '', sortBy: string = 'id', sortOrder: string = 'desc') {
  getUserTasks(page: number = 1, include: string = 'process,processRequest,processRequest.user,user,data',pmql: string = '(user_id=1)%20AND%20(status%20%3D%20%22In%20Progress%22)', sortBy: string = 'id', sortOrder: string = 'desc') {
    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.authService.authenticatedUserToken
      })
    };

    return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks?page='+ page +'&include='+ include +'&pmql='+ pmql +'&sortBy='+ sortBy +'&order_direction='+ sortOrder, httpOptions);
    //return this.httpClient.get(this.authService.apiUrl +'/api/1.0/tasks?page='+ page +'&filter='+ filter +'&sortBy='+ sortBy +'&order_direction='+ sortOrder, httpOptions);
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
