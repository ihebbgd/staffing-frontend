import { CertificationStatus } from './common.model';

// CertificationResponse
export interface Certification {
  id: string;
  employeeId: string;
  name: string;
  issuingOrganization?: string;
  skillId?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: CertificationStatus;
  credentialId?: string;
}

// POST /api/certifications, PUT /api/certifications/{id} — CertificationRequest.
// employeeId + name required.
export interface CertificationRequest {
  employeeId: string;
  name: string;
  issuingOrganization?: string;
  skillId?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
}

// GET /api/reports/certifications — CertificationReport
export interface CertificationReport {
  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  active: Certification[];
  expiringSoon: Certification[];
  expired: Certification[];
}
