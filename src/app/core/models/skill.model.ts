// SkillResponse
export interface Skill {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

// POST /api/skills, PUT /api/skills/{id} — SkillRequest. `name` is required.
export interface SkillRequest {
  name: string;
  category?: string;
  description?: string;
}
