import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChainConfigComponent } from './chain-config.component';
import { ChainConfig, WorkflowNode } from '../../../../shared/models/workflow.model';

describe('ChainConfigComponent', () => {
  let component: ChainConfigComponent;
  let fixture: ComponentFixture<ChainConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChainConfigComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChainConfigComponent);
    component = fixture.componentInstance;
    component.config = {
      chainType: 'sequential',
      nodes: ['node-1', 'node-2'],
      transforms: {}
    };
    component.nodes = [
      { id: 'node-1', type: 'input', label: 'Node 1', data: {} },
      { id: 'node-2', type: 'output', label: 'Node 2', data: {} }
    ];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should remove node from chain', () => {
    const initialLength = component.config.nodes.length;
    component.removeNode('node-1');
    expect(component.config.nodes.length).toBe(initialLength - 1);
  });

  it('should get node label', () => {
    const label = component.getNodeLabel('node-1');
    expect(label).toBe('Node 1');
  });
});

