"""GitOps API endpoints for YAML validation and schema management."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import yaml
import jsonschema
from jsonschema import validate, ValidationError

router = APIRouter()


class YamlValidateRequest(BaseModel):
    """Request model for YAML validation."""
    yaml: str = Field(..., description="YAML content to validate")


class YamlValidateResponse(BaseModel):
    """Response model for YAML validation."""
    valid: bool
    errors: List[str] = Field(default_factory=list)


class GitOpsSyncRequest(BaseModel):
    """Request model for Git sync."""
    repo: Optional[str] = None
    branch: Optional[str] = None


class GitOpsSyncResponse(BaseModel):
    """Response model for Git sync."""
    success: bool
    message: str
    toolsAdded: int = 0
    toolsUpdated: int = 0
    errors: List[str] = Field(default_factory=list)


def get_tool_schema() -> Dict[str, Any]:
    """Generate JSON Schema for Tool model from Pydantic."""
    # Define the Tool schema based on the frontend interface
    schema = {
        "type": "object",
        "properties": {
            "toolId": {
                "type": "string",
                "description": "Unique identifier for the tool"
            },
            "name": {
                "type": "string",
                "description": "Tool name"
            },
            "description": {
                "type": "string",
                "description": "Tool description"
            },
            "domain": {
                "type": "string",
                "description": "Tool domain"
            },
            "capabilities": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of tool capabilities"
            },
            "ownerTeam": {
                "type": "string",
                "description": "Owner team"
            },
            "contact": {
                "type": "string",
                "description": "Contact email"
            },
            "securityClass": {
                "type": "string",
                "enum": ["public", "internal", "restricted", "highly-restricted"],
                "description": "Security classification"
            },
            "lifecycleState": {
                "type": "string",
                "enum": ["development", "staging", "pilot", "production", "deprecated", "retired"],
                "description": "Lifecycle state"
            },
            "tags": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of tags"
            },
            "policyRef": {
                "type": "string",
                "description": "Policy reference"
            },
            "qualityScore": {
                "type": "number",
                "minimum": 0,
                "maximum": 100,
                "description": "Quality score"
            },
            "rateLimits": {
                "type": "object",
                "properties": {
                    "maxPerMinute": {
                        "type": "number",
                        "description": "Maximum requests per minute"
                    },
                    "maxConcurrency": {
                        "type": "number",
                        "description": "Maximum concurrent requests"
                    },
                    "timeoutMs": {
                        "type": "number",
                        "description": "Request timeout in milliseconds"
                    },
                    "retryPolicy": {
                        "type": "string",
                        "enum": ["exponential", "linear", "fixed"],
                        "description": "Retry policy type"
                    }
                },
                "description": "Rate limit configuration"
            },
            "versions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "version": {"type": "string"},
                        "schema": {"type": "object"},
                        "deprecated": {"type": "boolean"},
                        "deployment": {
                            "type": "object",
                            "properties": {
                                "env": {
                                    "type": "string",
                                    "enum": ["dev", "staging", "prod"]
                                },
                                "endpoint": {"type": "string"}
                            }
                        },
                        "health": {
                            "type": "object",
                            "properties": {
                                "lastCheck": {"type": "string"},
                                "status": {
                                    "type": "string",
                                    "enum": ["healthy", "unhealthy", "unknown"]
                                }
                            }
                        }
                    },
                    "required": ["version", "schema", "deprecated"]
                },
                "description": "Tool versions"
            },
            "dependencyGraph": {
                "type": "object",
                "properties": {
                    "dependsOnTools": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "dependsOnServices": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "modelDependencies": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                }
            },
            "gitOpsSource": {
                "type": "object",
                "properties": {
                    "repo": {"type": "string"},
                    "commit": {"type": "string"},
                    "branch": {"type": "string"}
                },
                "required": ["repo", "commit"]
            },
            "retirementPlan": {
                "type": "object",
                "properties": {
                    "autoSunset": {"type": "boolean"},
                    "retirementDate": {"type": "string"},
                    "replacementToolId": {"type": "string"}
                },
                "required": ["autoSunset"]
            },
            "createdAt": {"type": "string"},
            "updatedAt": {"type": "string"}
        },
        "required": ["toolId", "name"]
    }
    return schema


@router.post("/gitops/validate", response_model=YamlValidateResponse)
async def validate_yaml(request: YamlValidateRequest):
    """Validate YAML content against tool schema."""
    errors: List[str] = []
    
    try:
        # Parse YAML
        try:
            parsed = yaml.safe_load(request.yaml)
            if parsed is None:
                return YamlValidateResponse(
                    valid=False,
                    errors=["YAML content is empty or invalid"]
                )
        except yaml.YAMLError as e:
            return YamlValidateResponse(
                valid=False,
                errors=[f"YAML syntax error: {str(e)}"]
            )
        
        # Validate against schema
        schema = get_tool_schema()
        try:
            validate(instance=parsed, schema=schema)
        except ValidationError as e:
            errors.append(f"Schema validation error: {e.message}")
            if e.path:
                errors.append(f"Path: {'/'.join(str(p) for p in e.path)}")
        except Exception as e:
            errors.append(f"Validation error: {str(e)}")
        
        return YamlValidateResponse(
            valid=len(errors) == 0,
            errors=errors
        )
        
    except Exception as e:
        return YamlValidateResponse(
            valid=False,
            errors=[f"Unexpected error: {str(e)}"]
        )


@router.get("/gitops/schema")
async def get_tool_schema_endpoint():
    """Get JSON Schema for tool definitions."""
    return get_tool_schema()


@router.post("/gitops/sync", response_model=GitOpsSyncResponse)
async def sync_from_git(request: GitOpsSyncRequest):
    """Sync tool definitions from Git repository."""
    # Mock implementation for now
    # In a real implementation, this would:
    # 1. Clone/fetch from the Git repository
    # 2. Parse YAML files
    # 3. Validate against schema
    # 4. Update tool registry
    
    repo = request.repo or "default-repo"
    branch = request.branch or "main"
    
    # Mock response
    return GitOpsSyncResponse(
        success=True,
        message=f"Sync completed from {repo} (branch: {branch})",
        toolsAdded=0,
        toolsUpdated=0,
        errors=[]
    )

