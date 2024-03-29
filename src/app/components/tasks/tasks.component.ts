import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
//import { UserAuth } from 'src/app/models/userAuth';

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


  taskForm: FormGroup;

  //my_screen = {};
  color="green";

//  constructor(private userService: UserService, private formBuilder: FormBuilder, private formGroup: FormGroup) {
  constructor(public userService: UserService, private formBuilder: FormBuilder) {
    this.taskForm = this.formBuilder.group({


    });

  this.taskForm = new FormGroup({
      name : new FormControl(),
      lastname : new FormControl()
    });
  }

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


//-------------------------- Submit task --------------



//  submitCase(formData: UserAuth): void{
  //  this.submitCase(formData);
  //  console.log('ggggggggg');
    //console.log(response.data);
//  }

}
