# Test health check endpoints locally
# This script runs a quick test to verify the health check endpoints

# Function to check if a URL responds successfully
test_url() {
  local url=$1
  local description=$2
  
  echo "Testing $description at $url..."
  
  # Try curl first
  if command -v curl &> /dev/null; then
    response=$(curl -s -w "%{http_code}" -o /dev/null "$url")
    if [ "$response" = "200" ]; then
      echo "✅ $description test PASSED"
      return 0
    else
      echo "❌ $description test FAILED (HTTP $response)"
      return 1
    fi
  
  # Fall back to Invoke-WebRequest if curl is not available
  elif command -v pwsh &> /dev/null || command -v powershell &> /dev/null; then
    if command -v pwsh &> /dev/null; then
      ps_cmd="pwsh"
    else
      ps_cmd="powershell"
    fi
    
    status=$($ps_cmd -Command "try { Invoke-WebRequest -Uri '$url' -UseBasicParsing | Select-Object -ExpandProperty StatusCode } catch { \$_.Exception.Response.StatusCode.value__ }")
    
    if [ "$status" = "200" ]; then
      echo "✅ $description test PASSED"
      return 0
    else
      echo "❌ $description test FAILED (HTTP $status)"
      return 1
    fi
  
  else
    echo "❌ Neither curl nor PowerShell is available. Cannot test health check."
    return 1
  fi
}

# Set base URL (update if using a different port)
base_url="http://localhost:8080"

# Run tests
echo "======= HEALTH CHECK VERIFICATION ======="
test_url "$base_url/health.json" "JSON health check"
test_url "$base_url/health" "HTML health check"
test_url "$base_url/" "Main application"
echo "========================================="
