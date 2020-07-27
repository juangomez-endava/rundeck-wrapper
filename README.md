# Rundeck Wrapper

Wrapper for built-cli that remembers intern executions, detects the id of the last intern execution and keeps command history

## Usage

1. Install built-cli and nodejs

2. Clone the repo

```bash
git clone https://github.com/juangomez-endava/rundeck-wrapper.git ~/rundeck 
```

3. Add the following alias to your console .bashrc or .bash_profile

```bash
alias rundeck="node ~/rundeck/index.js" 
```