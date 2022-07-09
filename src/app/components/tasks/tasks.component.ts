import { Component, OnInit } from '@angular/core';
import { Request } from 'src/app/models/request';
import { Task } from 'src/app/models/task';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {
  pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    lastPage: null,
    totalItems: null
  }
  selectedRequest: Request;
  selectedTask: Task;
  userTasks = [];

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.getUserTasks();
  }


  async getUserTask(taskId: number): Promise<void> {
    this.selectedTask = null;
    this.userService.getUserTask(taskId).subscribe((response: Task) => {
      this.selectedTask = response;
      this.getUserRequest(response.process_request_id);
    },
    (error) => {
      console.log(error);
    });
  }

  async getUserRequest(requestId: number): Promise<void> {
    this.selectedRequest = null;
    this.userService.getUserRequest(requestId).subscribe((response: Request) => {
      this.selectedRequest = response;
      console.log(response.data);
    },
    (error) => {
      console.log(error);
    });
  }



  getUserTasks(page?: number, filter?: string, sortBy?: string, sortOrder?: string): void {
    this.userTasks = [];
     this.userService.getUserTasks(page, filter, sortBy, sortOrder).subscribe((response) => {
       console.log(response);
     this.userTasks = response['data'];
     this.pagination.currentPage = response['meta']['current_page'];
     this.pagination.lastPage = response['meta']['last_page'];
     this.pagination.totalItems = response['meta']['total'];
     },
     (error) => {
       console.error(error);
     })
  }

}
