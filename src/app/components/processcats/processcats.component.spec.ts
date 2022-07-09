import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcesscatsComponent } from './processcats.component';

describe('ProcesscatsComponent', () => {
  let component: ProcesscatsComponent;
  let fixture: ComponentFixture<ProcesscatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcesscatsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcesscatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
