import { AllocationStatus } from './common.model';

// AllocationResponse
export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  allocatedHoursPerWeek?: number;
  startDate?: string;
  endDate?: string;
  status?: AllocationStatus;
  roleOnProject?: string;
  createdAt?: string;
  overAllocationWarning?: boolean;
  employeeUtilizationPercent?: number;
}

// POST /api/allocations, PUT /api/allocations/{id} — AllocationRequest.
// employeeId + projectId required.
export interface AllocationRequest {
  employeeId: string;
  projectId: string;
  allocatedHoursPerWeek?: number;
  startDate?: string;
  endDate?: string;
  status?: AllocationStatus;
  roleOnProject?: string;
  dateRangeValid?: boolean;
}

// WorkloadResponse (allocations/workload, me/workload, allocations/conflicts)
export interface Workload {
  employeeId: string;
  employeeName: string;
  weeklyCapacityHours: number;
  totalAllocatedHours: number;
  utilizationPercent: number;
  overAllocated: boolean;
}
