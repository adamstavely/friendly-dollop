import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class SchemaService {
  constructor(private api: ApiService) {}

  getSchema(toolId: string): Observable<any> {
    return this.api.get(`/mcp/schema/${toolId}`);
  }

  getSchemaDiagram(toolId: string): Observable<any> {
    return this.api.get(`/tools/${toolId}/schema/diagram`);
  }
}

