import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgentConfigComponent } from './agent-config.component';
import { AgentConfig } from '../../../../shared/models/workflow.model';

describe('AgentConfigComponent', () => {
  let component: AgentConfigComponent;
  let fixture: ComponentFixture<AgentConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgentConfigComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AgentConfigComponent);
    component = fixture.componentInstance;
    component.config = {
      agentType: 'react',
      llmProvider: 'openai',
      llmModel: 'gpt-4',
      temperature: 0.7,
      tools: []
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load defaults', () => {
    component.config = {} as AgentConfig;
    component.loadDefaults();
    expect(component.config.agentType).toBe('react');
    expect(component.config.llmProvider).toBe('openai');
  });

  it('should toggle tool selection', () => {
    component.toggleTool('tool-1', true);
    expect(component.config.tools).toContain('tool-1');
    
    component.toggleTool('tool-1', false);
    expect(component.config.tools).not.toContain('tool-1');
  });
});

