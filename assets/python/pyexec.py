# type: ignore

"""
Execute some Python code given from stdin and seed random number generator with argv[1].
and print all resulting global variables as JSON.
"""

import json
import sys
import types
import random

# Read the code from stdin
code = sys.stdin.read()

# Seed random number generator
seed = int(sys.argv[1])
random.seed(seed)

# Create a namespace for execution
namespace = {
    'seed': seed    # this makes sure that some variables are always present
}

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
