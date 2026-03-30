export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  department: string;
  weeklyCapacityHours: number;
  yearsOfExperience: number;
  active: boolean;
}

// Spring Data's Page<T> wrapper shape
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // current page index (0-based)
  size: number; // page size
}
