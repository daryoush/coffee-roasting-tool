# Cross-Platform Test Script

This file contains commands that will work on macOS, Linux, and WSL. 
It avoids package managers and root privileges, focusing on standard utilities and Python.

## 1. System Information
Let's check what system and user we are running as.

```bash
echo "Current User: $(whoami)"
echo "Hostname: $(hostname)"
uname -a
```
