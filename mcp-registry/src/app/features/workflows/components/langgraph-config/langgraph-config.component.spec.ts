import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanggraphConfigComponent } from './langgraph-config.component';
import { WorkflowDefinition } from '../../../../shared/models/workflow.model';

describe('LanggraphConfigComponent', () => {
  let component: LanggraphConfigComponent;
  let fixture: ComponentFixture<LanggraphConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanggraphConfigComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LanggraphConfigComponent);
    component = fixture.componentInstance;
    component.definition = {
      nodes: [],
      connections: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load example schema', () => {
    component.loadExampleSchema();
    expect(component.stateSchemaJson).toBeTruthy();
    expect(component.stateSchemaJson).toContain('properties');
  });

  it('should validate state schema', () => {
    component.stateSchemaJson = '{"type": "object", "properties": {}}';
    component.onStateSchemaChange();
    expect(component.schemaValidationError).toBeFalsy();
  });

  it('should detect invalid JSON', () => {
    component.stateSchemaJson = 'invalid json';
    component.onStateSchemaChange();
    expect(component.schemaValidationError).toBeTruthy();
  });
});

