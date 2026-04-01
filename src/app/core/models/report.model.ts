import { UtilizationStatus } from './common.model';

// GET /api/reports/utilization — UtilizationReportRow
export interface UtilizationReportRow {
  employeeId: string;
  employeeName: string;
  weeklyCapacityHours: number;
  allocatedHours: number;
  utilizationPercent: number;
  status: UtilizationStatus;
}
