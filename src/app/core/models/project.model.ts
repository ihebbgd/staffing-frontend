import { ProjectStatus } from './common.model';

// ProjectResponse
export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  requiredSkillIds?: string[];
}

// POST /api/projects, PUT /api/projects/{id} — ProjectRequest. `name` required.
export interface ProjectRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  requiredSkillIds?: string[];
}
