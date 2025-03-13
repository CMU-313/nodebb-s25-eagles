import os
import subprocess

def run_dlint():
    # Define the directory to lint
    directory_to_lint = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # Run dlint
    
    result = subprocess.run(['dlint', 'run', directory_to_lint], capture_output=True, text=True)

    # Print the output
    print(result.stdout)
    print(result.stderr)

if __name__ == '__main__':
    run_dlint()