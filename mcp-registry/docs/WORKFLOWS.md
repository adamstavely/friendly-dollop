# Workflow Management Guide

This guide explains how to create and manage workflows using LangGraph and LangChain in the MCP Registry.

## Table of Contents

1. [Creating LangGraph Workflows](#creating-langgraph-workflows)
2. [Creating LangChain Agent Workflows](#creating-langchain-agent-workflows)
3. [Creating LangChain Chain Workflows](#creating-langchain-chain-workflows)
4. [Execution Monitoring](#execution-monitoring)
5. [Best Practices](#best-practices)

## Creating LangGraph Workflows

### Step 1: Create a New Workflow

1. Navigate to **Workflows** in the sidebar
2. Click **New Workflow**
3. Fill in basic information:
   - **Name**: Give your workflow a descriptive name
   - **Description**: Describe what the workflow does
   - **Engine**: Select **Langgraph**
   - **Workflow Type**: Select **Graph**

### Step 2: Build the Workflow Graph

1. Go to the **Workflow Builder** tab
2. Add nodes using the toolbar:
   - **Add Input**: Creates an input node
   - **Add MCP Tool**: Adds an MCP tool node
   - **Add LLM**: Adds an LLM node
   - **Add Output**: Creates an output node
3. Connect nodes by dragging from one node to another
4. Configure each node by selecting it and editing its properties

### Step 3: Configure LangGraph Settings

1. Go to the **LangGraph Config** tab
2. **State Schema**: Define the state structure using JSON Schema
   - Click **Load Example Schema** for a template
   - Define properties and their types
   - Mark required fields
3. **Node Configuration**: Configure individual nodes
   - For LLM nodes: Set provider, model, temperature, system message
   - For transform nodes: Select transform type and configuration
   - For MCP tool nodes: Select the tool to use
4. **Graph Preview**: Review the compiled graph structure
   - Check node count and connections
   - Validate the graph before saving

### Step 4: Save and Execute

1. Click **Save** to save your workflow
2. Navigate to the workflow detail page
3. Click **Execute** to run the workflow
4. Provide input data and click **Run**

## Creating LangChain Agent Workflows

### Step 1: Create Agent Workflow

1. Create a new workflow
2. Set **Engine** to **Langchain**
3. Set **Workflow Type** to **Agent**

### Step 2: Configure Agent

1. Go to the **Agent Config** tab
2. **Agent Type**: Select the agent type
   - **ReAct Agent**: Reasoning and acting agent
   - **OpenAI Functions Agent**: Uses function calling
   - **Plan and Execute Agent**: Plans before acting
3. **LLM Configuration**:
   - **Provider**: OpenAI or Anthropic
   - **Model**: Select the model (e.g., gpt-4, claude-3)
   - **Temperature**: Control randomness (0-2)
   - **Max Tokens**: Limit response length
4. **System Message**: Define the agent's behavior
5. **Persona**: Select an agent persona (optional)
   - Automatically loads tools available for that persona
6. **Tools**: Select MCP tools for the agent to use
   - Check tools from the available tools list
   - Tools are automatically converted to LangChain tools

### Step 3: Validate and Save

1. Click **Validate Configuration** to check for errors
2. Fix any validation errors
3. Click **Save** in the workflow builder

## Creating LangChain Chain Workflows

### Step 1: Create Chain Workflow

1. Create a new workflow
2. Set **Engine** to **Langchain**
3. Set **Workflow Type** to **Chain**

### Step 2: Configure Chain

1. Go to the **Chain Config** tab
2. **Chain Type**: Select the chain type
   - **Sequential**: Execute nodes in order
   - **Transform**: Apply transformations
   - **Router**: Route based on conditions
3. **Node Ordering**: Drag and drop nodes to reorder
   - Nodes execute in the order shown
   - Remove nodes by clicking the X button
4. **Transform Functions** (for transform chains):
   - Configure transform for each node
   - Select transform type and parameters

### Step 3: Preview and Save

1. Review the chain preview
2. Use **Auto-Order Nodes** to automatically order based on dependencies
3. Validate the configuration
4. Save the workflow

## Execution Monitoring

### Viewing Execution Details

1. Navigate to a workflow's detail page
2. Click on the **Executions** tab
3. Click on an execution to view details

### LangGraph Execution Viewer

For LangGraph workflows, the execution viewer shows:

- **Execution Timeline**: Step-by-step execution with timestamps
- **State Visualization**: State at each step
- **State Diff**: Changes between steps
- **Execution Tree**: Visual tree of execution flow

### Agent Execution Viewer

For LangChain agent workflows, the execution viewer shows:

- **Tool Calls**: All tool invocations with inputs/outputs
- **Reasoning Steps**: Agent's thought process
- **Intermediate Steps**: Detailed execution steps
- **Decision Tree**: Visual representation of agent decisions

### Real-time Streaming

For long-running executions:

1. Start an execution
2. The execution detail view automatically streams updates
3. See progress in real-time as nodes execute
4. Cancel execution if needed

## Best Practices

### LangGraph Workflows

1. **Define State Schema**: Always define a clear state schema
   - Helps with validation and debugging
   - Makes state structure explicit

2. **Use Checkpointing**: Enable checkpointing for long workflows
   - Allows resuming from checkpoints
   - Helps with debugging

3. **Node Naming**: Use descriptive node IDs and labels
   - Makes debugging easier
   - Improves workflow readability

4. **Error Handling**: Configure error handling for critical nodes
   - Use try-catch patterns in node functions
   - Provide fallback behaviors

### Agent Workflows

1. **System Messages**: Write clear, specific system messages
   - Define the agent's role and capabilities
   - Set expectations for behavior

2. **Tool Selection**: Only include necessary tools
   - Too many tools can confuse the agent
   - Select tools relevant to the task

3. **Temperature**: Adjust temperature based on task
   - Lower (0.1-0.3) for deterministic tasks
   - Higher (0.7-1.0) for creative tasks

### Chain Workflows

1. **Node Ordering**: Ensure logical execution order
   - Input nodes should come first
   - Output nodes should come last

2. **Transform Functions**: Use appropriate transforms
   - Test transforms with sample data
   - Document transform configurations

3. **Error Handling**: Handle errors at each step
   - Validate inputs before processing
   - Provide meaningful error messages

## Troubleshooting

### Workflow Validation Errors

- **Circular Dependencies**: Check node connections for cycles
- **Missing Nodes**: Ensure all referenced nodes exist
- **Invalid Configuration**: Check node configurations match their types

### Execution Errors

- **LLM Errors**: Check API keys and model availability
- **Tool Errors**: Verify tool IDs and tool availability
- **State Errors**: Ensure state matches the defined schema

### Performance Issues

- **Long Execution Times**: Check for inefficient node configurations
- **Memory Issues**: Reduce checkpoint frequency for large states
- **API Rate Limits**: Implement retry logic and rate limiting

