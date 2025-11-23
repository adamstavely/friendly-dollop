export interface SecurityScan {
  id: string;
  traceId: string;
  timestamp: string;
  score: number; // 0-100
  threats: SecurityThreat[];
  compliance: ComplianceCheck[];
  recommendations: string[];
}

export interface SecurityThreat {
  type: ThreatType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string; // Where in the trace
  detectedAt: string;
  mitigation?: string;
}

export type ThreatType = 
  | 'pii_exposure'
  | 'prompt_injection'
  | 'data_leakage'
  | 'unauthorized_access'
  | 'malicious_output'
  | 'compliance_violation';

export interface ComplianceCheck {
  rule: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  details?: any;
}

export interface PIIDetection {
  type: PIIType;
  value: string;
  confidence: number;
  location: {
    start: number;
    end: number;
  };
}

export type PIIType = 
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'ip_address'
  | 'name'
  | 'address'
  | 'date_of_birth';

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'pii' | 'injection' | 'content' | 'compliance';
  enabled: boolean;
  config: Record<string, any>;
}

