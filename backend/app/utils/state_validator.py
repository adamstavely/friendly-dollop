"""State schema validation for LangGraph workflows."""
from typing import Dict, Any, List, Optional
import json
import jsonschema
from jsonschema import validate, ValidationError
import logging

logger = logging.getLogger(__name__)


class StateValidator:
    """Validator for LangGraph state schemas."""
    
    @staticmethod
    def validate_state_schema(schema: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate a state schema definition."""
        if not schema:
            return True, None
        
        try:
            # Validate that schema is a valid JSON schema
            jsonschema.Draft7Validator.check_schema(schema)
            return True, None
        except jsonschema.SchemaError as e:
            return False, f"Invalid state schema: {str(e)}"
        except Exception as e:
            return False, f"Schema validation error: {str(e)}"
    
    @staticmethod
    def validate_state_against_schema(state: Dict[str, Any], schema: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate state data against a schema."""
        if not schema:
            return True, None
        
        try:
            validate(instance=state, schema=schema)
            return True, None
        except ValidationError as e:
            return False, f"State validation failed: {e.message} at {'.'.join(str(p) for p in e.path)}"
        except Exception as e:
            return False, f"State validation error: {str(e)}"
    
    @staticmethod
    def get_state_schema_defaults(schema: Dict[str, Any]) -> Dict[str, Any]:
        """Get default values from state schema."""
        defaults = {}
        
        if not schema or "properties" not in schema:
            return defaults
        
        for prop_name, prop_def in schema["properties"].items():
            if "default" in prop_def:
                defaults[prop_name] = prop_def["default"]
            elif prop_def.get("type") == "object" and "properties" in prop_def:
                defaults[prop_name] = StateValidator.get_state_schema_defaults(prop_def)
            elif prop_def.get("type") == "array":
                defaults[prop_name] = []
            elif prop_def.get("type") == "string":
                defaults[prop_name] = ""
            elif prop_def.get("type") == "number" or prop_def.get("type") == "integer":
                defaults[prop_name] = 0
            elif prop_def.get("type") == "boolean":
                defaults[prop_name] = False
        
        return defaults

