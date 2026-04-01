import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Project, ProjectRequest } from '../models/project.model';

// Projects — /api/projects (full CRUD, paged list)
@Injectable({ providedIn: 'root' })
export class ProjectService extends CrudService<Project, ProjectRequest> {
  constructor() {
    super('projects');
  }
}
