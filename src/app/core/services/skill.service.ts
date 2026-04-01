import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { Skill, SkillRequest } from '../models/skill.model';

// Skills — /api/skills (full CRUD, paged list)
@Injectable({ providedIn: 'root' })
export class SkillService extends CrudService<Skill, SkillRequest> {
  constructor() {
    super('skills');
  }
}
