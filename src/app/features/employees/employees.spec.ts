import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Employees } from './employees';

describe('Employees', () => {
  let component: Employees;
  let fixture: ComponentFixture<Employees>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Employees],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Employees);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    // ngOnInit fires GET /employees — satisfy the pending request.
    httpMock.match(() => true).forEach((req) => req.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 }));
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the table view', () => {
    expect(component.view()).toBe('table');
  });
});
