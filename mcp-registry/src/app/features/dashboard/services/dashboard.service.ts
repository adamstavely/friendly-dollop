import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, catchError, map } from 'rxjs';
import { ToolService } from '../../tools/services/tool.service';
import { BundleService } from '../../bundles/services/bundle.service';
import { LifecycleService } from '../../lifecycle/services/lifecycle.service';
import { QualityService } from '../../quality/services/quality.service';
import { RetirementService } from '../../retirement/services/retirement.service';
import { ComplianceService } from '../../compliance/services/compliance.service';

export interface DashboardMetrics {
  totalTools: number;
  productionTools: number;
  stagingTools: number;
  developmentTools: number;
  deprecatedTools: number;
  averageQualityScore: number;
  activeBundles: number;
  toolsNeedingAttention: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface RecentActivity {
  id: string;
  type: 'tool_created' | 'tool_updated' | 'tool_promoted' | 'quality_updated' | 'compliance_scan';
  toolId?: string;
  toolName?: string;
  message: string;
  timestamp: string;
  user?: string;
}

export interface DashboardAlert {
  id: string;
  type: 'promotion_needed' | 'orphan_tool' | 'quality_drop' | 'compliance_violation' | 'health_check_failed';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  toolId?: string;
  actionUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private toolService: ToolService,
    private bundleService: BundleService,
    private lifecycleService: LifecycleService,
    private qualityService: QualityService,
    private retirementService: RetirementService,
    private complianceService: ComplianceService
  ) {}

  getDashboardData(): Observable<{
    metrics: DashboardMetrics;
    recentActivity: RecentActivity[];
    alerts: DashboardAlert[];
  }> {
    return forkJoin({
      metrics: this.getMetrics(),
      recentActivity: this.getRecentActivity(),
      alerts: this.getAlerts()
    }).pipe(
      map((data) => ({
        metrics: data.metrics,
        recentActivity: data.recentActivity,
        alerts: this.generateAlertsFromData(data.alerts)
      })),
      catchError(() => of({
        metrics: this.getDefaultMetrics(),
        recentActivity: [],
        alerts: []
      }))
    );
  }

  private generateAlertsFromData(data: any): DashboardAlert[] {
    const alerts: DashboardAlert[] = [];

    // Orphan tools alert
    if (data.orphans && data.orphans.length > 0) {
      alerts.push({
        id: 'orphans',
        type: 'orphan_tool',
        severity: 'warning',
        title: `${data.orphans.length} Orphan Tool(s)`,
        message: 'Tools without an owner team need attention',
        actionUrl: '/retirement'
      });
    }

    // Tools needing promotion
    if (data.tools && data.tools.tools) {
      const stagingTools = data.tools.tools.filter((t: any) => 
        t.lifecycleState === 'staging' || t.lifecycleState === 'pilot'
      );
      if (stagingTools.length > 0) {
        alerts.push({
          id: 'promotions',
          type: 'promotion_needed',
          severity: 'info',
          title: `${stagingTools.length} Tool(s) Ready for Promotion`,
          message: 'Tools in staging/pilot may be ready for production',
          actionUrl: '/lifecycle'
        });
      }
    }

    return alerts;
  }

  getMetrics(): Observable<DashboardMetrics> {
    return forkJoin({
      tools: this.toolService.getTools({ limit: 1000 }).pipe(
        catchError(() => of({ tools: [], total: 0 }))
      ),
      bundles: this.bundleService.getBundles().pipe(
        catchError(() => of([]))
      ),
      lifecycle: this.lifecycleService.getLifecycleDashboard().pipe(
        catchError(() => of({ totalTools: 0, productionTools: 0, stagingTools: 0, developmentTools: 0, deprecatedTools: 0 }))
      ),
      orphans: this.retirementService.getOrphans().pipe(
        catchError(() => of([]))
      )
    }).pipe(
      catchError(() => of({
        tools: { tools: [], total: 0 },
        bundles: [],
        lifecycle: { totalTools: 0, productionTools: 0, stagingTools: 0, developmentTools: 0, deprecatedTools: 0 },
        orphans: []
      }))
    ).pipe(
      map((data) => {
        const tools = data.tools.tools || [];
        const bundles = data.bundles || [];
        const lifecycle = data.lifecycle || { totalTools: 0, productionTools: 0, stagingTools: 0, developmentTools: 0, deprecatedTools: 0 };
        const orphans = data.orphans || [];

        // Calculate average quality score
        const qualityScores = tools
          .filter((t: any) => t.qualityScore && t.qualityScore > 0)
          .map((t: any) => t.qualityScore);
        const avgQualityScore = qualityScores.length > 0
          ? qualityScores.reduce((sum: number, score: number) => sum + score, 0) / qualityScores.length
          : 0;

        // Count active bundles
        const activeBundles = bundles.filter((b: any) => b.active).length;

        // Count tools needing attention (orphans + low quality)
        const lowQualityTools = tools.filter((t: any) => 
          t.qualityScore && t.qualityScore < 70
        ).length;
        const toolsNeedingAttention = orphans.length + lowQualityTools;

        // Determine system health
        let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (toolsNeedingAttention > 5 || orphans.length > 3) {
          systemHealth = 'critical';
        } else if (toolsNeedingAttention > 0 || orphans.length > 0) {
          systemHealth = 'warning';
        }

        return {
          totalTools: lifecycle.totalTools || tools.length,
          productionTools: lifecycle.productionTools || 0,
          stagingTools: lifecycle.stagingTools || 0,
          developmentTools: lifecycle.developmentTools || 0,
          deprecatedTools: lifecycle.deprecatedTools || 0,
          averageQualityScore: avgQualityScore,
          activeBundles: activeBundles,
          toolsNeedingAttention: toolsNeedingAttention,
          systemHealth: systemHealth
        };
      }),
      catchError(() => of(this.getDefaultMetrics()))
    );
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    // Mock recent activity - in production, this would come from an activity/audit API
    return of([
      {
        id: '1',
        type: 'tool_created',
        toolId: 'tool-1',
        toolName: 'Search API',
        message: 'New tool created',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user: 'admin'
      },
      {
        id: '2',
        type: 'tool_promoted',
        toolId: 'tool-2',
        toolName: 'Data Processor',
        message: 'Promoted to production',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user: 'admin'
      },
      {
        id: '3',
        type: 'quality_updated',
        toolId: 'tool-1',
        toolName: 'Search API',
        message: 'Quality score updated to 85',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      }
    ]);
  }

  getAlerts(): Observable<any> {
    return forkJoin({
      orphans: this.retirementService.getOrphans().pipe(
        catchError(() => of([]))
      ),
      tools: this.toolService.getTools({ limit: 1000 }).pipe(
        catchError(() => of({ tools: [], total: 0 }))
      )
    }).pipe(
      catchError(() => of({ orphans: [], tools: { tools: [] } }))
    );
  }

  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalTools: 0,
      productionTools: 0,
      stagingTools: 0,
      developmentTools: 0,
      deprecatedTools: 0,
      averageQualityScore: 0,
      activeBundles: 0,
      toolsNeedingAttention: 0,
      systemHealth: 'healthy'
    };
  }
}

