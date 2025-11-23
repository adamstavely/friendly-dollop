import { Injectable } from '@angular/core';
import { Observable, of, catchError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MockDataService } from '../../../core/services/mock-data.service';

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
  constructor(
    private api: ApiService,
    private mockData: MockDataService
  ) {}

  getSchema(toolId: string): Observable<any> {
    return this.api.get(`/mcp/schema/${toolId}`).pipe(
      catchError(() => {
        const tool = this.mockData.getMockTool(toolId);
        return of(tool?.versions[0]?.schema || {});
      })
    );
  }

  getSchemaDiagram(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/schema/diagram`).pipe(
      catchError(() => of({ diagramUrl: '' }))
    );
  }
}

