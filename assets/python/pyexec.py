# type: ignore

"""
Execute some Python code given from stdin
and print all resulting global variables as JSON.
"""

import json
import sys
import types

# Read the code from stdin
code = sys.stdin.read()

# Create a namespace for execution
namespace = {}

# Execute the code in the namespace
exec(code, namespace)

# Filter out built-in variables and imported modules
variables = {
    key: value 
    for key, value in namespace.items() 
    if not key.startswith('__') and not isinstance(value, types.ModuleType)
}

# Print the variables as JSON
print(json.dumps(variables, indent=4))
