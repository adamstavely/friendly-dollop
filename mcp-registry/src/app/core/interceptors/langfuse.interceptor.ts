import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { LangFuseService } from '../services/langfuse.service';
import { ConfigService } from '../services/config.service';

export const langfuseInterceptor: HttpInterceptorFn = (req, next) => {
  const langfuse = inject(LangFuseService);
  const config = inject(ConfigService);

  // Only track if LangFuse is enabled
  if (!config.isLangFuseEnabled() || !langfuse.isEnabled()) {
    return next(req);
  }

  const url = req.url;
  const method = req.method;
  const startTime = Date.now();

  // Determine if this is an LLM-related request
  const isLLMRequest = 
    url.includes('/workflows/') && (method === 'POST' || method === 'PUT') ||
    url.includes('/workflows/') && url.includes('/execute') ||
    url.includes('/tools/') && url.includes('/invoke') ||
    url.includes('/prompts/') && url.includes('/execute') ||
    url.includes('/agents/') && (method === 'POST' || method === 'PUT');

  // Determine if this is a workflow execution
  const isWorkflowExecution = url.includes('/workflows/') && url.includes('/execute');

  // Determine if this is a tool invocation
  const isToolInvocation = url.includes('/tools/') && url.includes('/invoke');

  // Create trace for LLM-related requests
  let traceId: string | null = null;
  let executionId: string | null = null;
  
  if (isLLMRequest) {
    try {
      const workflowId = url.match(/\/workflows\/([^\/]+)/)?.[1];
      const toolId = url.match(/\/tools\/([^\/]+)/)?.[1];
      
      executionId = `exec-${Date.now()}`;
      
      if (isWorkflowExecution && workflowId) {
        traceId = langfuse.createWorkflowTrace(
          workflowId,
          `Workflow Execution: ${workflowId}`,
          executionId,
          req.body,
          { workflowId, workflowName: workflowId }
        );
      } else if (isToolInvocation && toolId) {
        // For tool invocations, try to get active trace or create a new one
        traceId = langfuse.createWorkflowTrace(
          toolId,
          `Tool Invocation: ${toolId}`,
          executionId,
          req.body,
          { workflowId: toolId, workflowName: toolId }
        );
      }
    } catch (error) {
      console.warn('Failed to create LangFuse trace:', error);
    }
  }

  return next(req).pipe(
    tap({
      next: (response) => {
        const duration = Date.now() - startTime;
        
        if (isLLMRequest && traceId && executionId) {
          try {
            // Update trace with response
            const responseData = (response as any)?.body || response;
            langfuse.updateTraceOutput(executionId, responseData);
            
            // End trace
            langfuse.endTrace(executionId, responseData);
          } catch (error) {
            console.warn('Failed to update LangFuse trace:', error);
          }
        }

        // Track API call metrics
        if (isLLMRequest) {
          // Could create a span for the API call itself
          // This is optional and depends on how granular you want tracking
        }
      },
      error: (error) => {
        const duration = Date.now() - startTime;
        
        if (isLLMRequest && traceId && executionId) {
          try {
            // Update trace with error
            langfuse.updateTraceOutput(executionId, {
              error: error.message || 'Request failed',
              status: error.status,
              duration
            });
            
            // End trace with error
            langfuse.endTrace(executionId, {
              error: error.message || 'Request failed',
              status: error.status
            });
          } catch (err) {
            console.warn('Failed to update LangFuse trace on error:', err);
          }
        }
      }
    }),
    catchError((error) => {
      // Error is already handled in tap, just rethrow
      throw error;
    })
  );
};

