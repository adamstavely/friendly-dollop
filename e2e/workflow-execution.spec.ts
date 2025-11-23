/**
 * E2E tests for workflow execution
 * Note: These tests require a running backend and frontend
 */

describe('Workflow Execution E2E', () => {
  beforeEach(() => {
    // Setup: Navigate to workflows page
    cy.visit('/workflows');
  });

  it('should create a LangGraph workflow', () => {
    cy.contains('New Workflow').click();
    cy.get('input[placeholder="Enter workflow name"]').type('Test LangGraph Workflow');
    cy.get('mat-select[ng-reflect-name="engine"]').click();
    cy.contains('Langgraph').click();
    cy.get('mat-select[ng-reflect-name="workflowType"]').click();
    cy.contains('Graph').click();
    
    // Add nodes
    cy.contains('Add Input').click();
    cy.contains('Add LLM').click();
    cy.contains('Add Output').click();
    
    // Configure LangGraph
    cy.contains('LangGraph Config').click();
    cy.contains('Load Example Schema').click();
    
    // Save workflow
    cy.contains('Save').click();
    cy.url().should('include', '/workflows/');
  });

  it('should execute a workflow', () => {
    // Navigate to workflow detail
    cy.visit('/workflows/test-workflow-1');
    
    // Execute workflow
    cy.contains('Execute').click();
    cy.get('input[placeholder="Input data"]').type('{"input": "test"}');
    cy.contains('Run').click();
    
    // Check execution status
    cy.contains('Execution', { timeout: 10000 }).should('be.visible');
  });

  it('should view execution details', () => {
    cy.visit('/workflows/test-workflow-1');
    cy.contains('Executions').click();
    cy.get('mat-list-item').first().click();
    
    // Check execution detail dialog
    cy.contains('Execution Details').should('be.visible');
    cy.contains('Overview').should('be.visible');
  });
});

