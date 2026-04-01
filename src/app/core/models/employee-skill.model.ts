// EmployeeSkillResponse
export interface EmployeeSkill {
  id: string;
  employeeId: string;
  skillId: string;
  proficiencyLevel?: number;
}

// EmployeeSkillRequest. employeeId + skillId required;
// proficiencyLevel is an integer 1..5 when provided.
export interface EmployeeSkillRequest {
  employeeId: string;
  skillId: string;
  proficiencyLevel?: number;
}

export const PROFICIENCY_MIN = 1;
export const PROFICIENCY_MAX = 5;
