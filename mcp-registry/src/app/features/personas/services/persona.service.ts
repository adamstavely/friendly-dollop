import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class PersonaService {
  constructor(private api: ApiService) {}

  negotiate(persona: string): Observable<any> {
    return this.api.post('/mcp/negotiate/persona', { persona });
  }
}

