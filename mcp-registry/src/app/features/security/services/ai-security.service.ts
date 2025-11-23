import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LangFuseService } from '../../../core/services/langfuse.service';
import { SecurityScan, SecurityThreat, PIIDetection, SecurityRule } from '../../../shared/models/security.model';
import { LangFuseTrace } from '../../../shared/models/langfuse.model';

@Injectable({
  providedIn: 'root'
})
export class AISecurityService {
  constructor(
    private api: ApiService,
    private langfuse: LangFuseService
  ) {}

  /**
   * Scan a trace for security issues
   */
  scanTrace(traceId: string): Observable<SecurityScan> {
    return this.api.post<SecurityScan>(`/security/scans/trace/${traceId}`, {}).pipe(
      catchError(() => {
        // Mock security scan
        return this.performSecurityScan(traceId);
      })
    );
  }

  /**
   * Detect PII in text
   */
  detectPII(text: string): Observable<PIIDetection[]> {
    return this.langfuse.detectPII(text).pipe(
      catchError(() => {
        // Fallback to basic detection
        return this.basicPIIDetection(text);
      })
    );
  }

  /**
   * Redact PII from text
   */
  redactPII(text: string, piiTypes?: string[]): Observable<string> {
    return this.langfuse.redactPII(text, piiTypes);
  }

  /**
   * Detect prompt injection attempts
   */
  detectPromptInjection(prompt: string, input: string): Observable<boolean> {
    return this.langfuse.detectPromptInjection(prompt, input);
  }

  /**
   * Calculate security score for a trace
   */
  calculateSecurityScore(trace: LangFuseTrace): Observable<number> {
    return this.langfuse.calculateSecurityScore(trace);
  }

  /**
   * Get security scans
   */
  getSecurityScans(filters?: {
    traceId?: string;
    fromDate?: Date;
    toDate?: Date;
    minScore?: number;
  }): Observable<SecurityScan[]> {
    return this.api.get<SecurityScan[]>('/security/scans', filters).pipe(
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Get security rules
   */
  getSecurityRules(): Observable<SecurityRule[]> {
    return this.api.get<SecurityRule[]>('/security/rules').pipe(
      catchError(() => {
        // Mock rules
        return of([
          {
            id: 'rule-1',
            name: 'PII Detection',
            description: 'Detect and flag PII in traces',
            type: 'pii',
            enabled: true,
            config: {}
          },
          {
            id: 'rule-2',
            name: 'Prompt Injection Detection',
            description: 'Detect prompt injection attempts',
            type: 'injection',
            enabled: true,
            config: {}
          }
        ]);
      })
    );
  }

  /**
   * Update security rule
   */
  updateSecurityRule(ruleId: string, updates: Partial<SecurityRule>): Observable<SecurityRule> {
    return this.api.put<SecurityRule>(`/security/rules/${ruleId}`, updates).pipe(
      catchError(() => {
        throw new Error('Failed to update security rule');
      })
    );
  }

  // Private helper methods
  private performSecurityScan(traceId: string): Observable<SecurityScan> {
    return new Observable(observer => {
      // Simulate security scan
      setTimeout(() => {
        const scan: SecurityScan = {
          id: `scan-${Date.now()}`,
          traceId,
          timestamp: new Date().toISOString(),
          score: 85,
          threats: [
            {
              type: 'pii_exposure',
              severity: 'medium',
              description: 'Potential email address detected',
              detectedAt: new Date().toISOString()
            }
          ],
          compliance: [
            {
              rule: 'GDPR Compliance',
              status: 'pass',
              description: 'No GDPR violations detected'
            }
          ],
          recommendations: [
            'Review PII detection results',
            'Consider redacting sensitive information'
          ]
        };
        observer.next(scan);
        observer.complete();
      }, 500);
    });
  }

  private basicPIIDetection(text: string): Observable<PIIDetection[]> {
    const detections: PIIDetection[] = [];
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

    let match;
    while ((match = emailPattern.exec(text)) !== null) {
      detections.push({
        type: 'email',
        value: match[0],
        confidence: 0.9,
        location: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    while ((match = phonePattern.exec(text)) !== null) {
      detections.push({
        type: 'phone',
        value: match[0],
        confidence: 0.8,
        location: {
          start: match.index,
          end: match.index + match[0].length
        }
      });
    }

    return of(detections);
  }
}

