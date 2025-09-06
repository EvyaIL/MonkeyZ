#!/usr/bin/env python3
"""
Comprehensive File Organization Script for MonkeyZ
Organizes all files into proper backend/ and frontend/ folder structure
"""

import os
import shutil
import json
from pathlib import Path
from typing import Dict, List, Tuple

class MonkeyZFileOrganizer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.backend_path = self.root_path / "backend"
        self.frontend_path = self.root_path / "frontend"
        
        # Create directories if they don't exist
        self.backend_path.mkdir(exist_ok=True)
        self.frontend_path.mkdir(exist_ok=True)
        
        # File organization mapping
        self.organization_plan = {
            # Backend files
            'backend': {
                'scripts': [
                    'get_products.js',
                    'create_and_test_coupons.js', 
                    'create_test_coupons.js',
                    'debug_coupon_production.js',
                    'debug_coupon_system.js',
                    'frontend_coupon_test.js',
                    'test_checkout_coupon_sync.js',
                    'test_coupon_apply.js',
                    'test_coupon_usage.js',
                    'test_debug_analytics.js',
                    'test_debug_coupon.js',
                    'test_email_change_coupon_fix.js',
                    'test_fixed_coupons.js',
                    'test_max_usage_fix.js',
                    'test_paypal_coupon_flow.js',
                    'test_production_coupon.js'
                ],
                'python_scripts': [
                    'check_coupon_states.py',
                    'comprehensive_coupon_fix.py',
                    'debug_coupon_endpoint.py',
                    'debug_coupon_issue.py',
                    'debug_coupon_production.py',
                    'debug_current_issues.py',
                    'debug_direct_db.py',
                    'debug_per_user_issue.py',
                    'deploy_email_fix.py',
                    'deploy_production_coupon_fix.py',
                    'digitalocean_deployer.py',
                    'fix_coupon_production.py',
                    'fixed_coupon_service.py',
                    'quick_coupon_setup.py',
                    'setup_test_coupons.py',
                    'test_comprehensive_stock_fix.py',
                    'test_coupon_api.py',
                    'test_coupon_fix_final.py',
                    'test_coupon_usage.js',
                    'test_coupon_validation_fix.py',
                    'test_email_change_fix.py',
                    'test_email_production.py',
                    'test_final_coupon_validation.py',
                    'test_max_usage_fix.py',
                    'test_order_deletion_fix.py',
                    'test_overall_usage_limits.py',
                    'test_per_user_coupon.py',
                    'test_per_user_validation.py',
                    'test_specific_fixes.py'
                ],
                'deployment': [
                    'deploy_coupon_fix.ps1',
                    'deploy_guide.ps1',
                    'Deploy-MonkeyZ.ps1',
                    'deploy.sh',
                    'fix-frontend-deployment.sh',
                    'install-performance.sh',
                    'pre-flight-check.sh',
                    'restart-backend.bat',
                    'start-dev.bat'
                ],
                'config': [
                    'docker-compose.prod.yml',
                    'docker-compose.yml'
                ]
            },
            
            # Frontend files would go here
            'frontend': {
                'components': [],
                'utils': [],
                'config': []
            },
            
            # Documentation files
            'docs': [
                'COMPREHENSIVE_COUPON_SYSTEM_ANALYSIS.md',
                'COMPREHENSIVE_STOCK_EMAIL_FIX_COMPLETE.md',
                'COUPON_FIX_SUMMARY.md',
                'COUPON_MAX_USAGE_FIX.md',
                'DEPLOY_TO_DIGITAL_OCEAN.md',
                'DIGITAL_OCEAN_FIX.md',
                'EMAIL_CHANGE_COUPON_FIX.md',
                'EMAIL_SYSTEM_DOCS.md',
                'ERROR_FIXES_SUMMARY.md',
                'FINAL_PAYPAL_FIX.md',
                'GOOGLE_OAUTH_SETUP.md',
                'IMPLEMENTED_FEATURES.md',
                'LAUNCH_CHECKLIST_AUG14.md',
                'LOGIN_ISSUES_FIX.md',
                'PAYPAL_CLIENT_ID_FIX.md',
                'PAYPAL_FIXES_SUMMARY.md',
                'PAYPAL_LIVE_DEPLOYMENT_GUIDE.md',
                'PERFORMANCE_OPTIMIZATION_PLAN.md',
                'PERFORMANCE_OPTIMIZATIONS.md',
                'PERFORMANCE_PLAN.md',
                'PRODUCTION_DEPLOYMENT_GUIDE.md',
                'PRODUCTION_READINESS_CHECKLIST.md',
                'PRODUCTION_READY_SUMMARY.md',
                'README.md',
                'STOCK_FULFILLMENT_SYSTEM.md'
            ],
            
            # Keep in root
            'root': [
                'package.json'
            ]
        }
    
    def analyze_current_structure(self) -> Dict[str, List[str]]:
        """Analyze current file structure"""
        current_files = {
            'python_files': [],
            'javascript_files': [],
            'config_files': [],
            'documentation': [],
            'shell_scripts': [],
            'other_files': []
        }
        
        for file_path in self.root_path.iterdir():
            if file_path.is_file():
                filename = file_path.name
                
                if filename.endswith('.py'):
                    current_files['python_files'].append(filename)
                elif filename.endswith('.js'):
                    current_files['javascript_files'].append(filename)
                elif filename.endswith(('.md', '.txt', '.rst')):
                    current_files['documentation'].append(filename)
                elif filename.endswith(('.sh', '.bat', '.ps1')):
                    current_files['shell_scripts'].append(filename)
                elif filename.endswith(('.json', '.yml', '.yaml', '.env')):
                    current_files['config_files'].append(filename)
                else:
                    current_files['other_files'].append(filename)
        
        return current_files
    
    def create_organization_plan(self) -> List[Tuple[str, str, str]]:
        """Create detailed organization plan"""
        moves = []  # (source, destination, reason)
        
        # Backend files
        for category, files in self.organization_plan['backend'].items():
            dest_dir = self.backend_path / category
            dest_dir.mkdir(exist_ok=True)
            
            for filename in files:
                source = self.root_path / filename
                if source.exists():
                    destination = dest_dir / filename
                    moves.append((str(source), str(destination), f"Backend {category}"))
        
        # Documentation files
        docs_dir = self.root_path / "docs"
        docs_dir.mkdir(exist_ok=True)
        
        for filename in self.organization_plan['docs']:
            source = self.root_path / filename
            if source.exists():
                destination = docs_dir / filename
                moves.append((str(source), str(destination), "Documentation"))
        
        return moves
    
    def execute_organization(self, dry_run: bool = True) -> Dict[str, int]:
        """Execute the file organization"""
        moves = self.create_organization_plan()
        stats = {
            'planned_moves': len(moves),
            'successful_moves': 0,
            'failed_moves': 0,
            'skipped_moves': 0
        }
        
        print(f"File Organization Plan ({'DRY RUN' if dry_run else 'LIVE RUN'})")
        print("=" * 60)
        
        for source, destination, reason in moves:
            try:
                source_path = Path(source)
                dest_path = Path(destination)
                
                if not source_path.exists():
                    print(f"⚠️  SKIP: {source} (file not found)")
                    stats['skipped_moves'] += 1
                    continue
                
                if dest_path.exists():
                    print(f"⚠️  SKIP: {destination} (destination exists)")
                    stats['skipped_moves'] += 1
                    continue
                
                print(f"📦 MOVE: {source}")
                print(f"    ➜   {destination}")
                print(f"    📝  Reason: {reason}")
                
                if not dry_run:
                    # Ensure destination directory exists
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(source_path), str(dest_path))
                    stats['successful_moves'] += 1
                else:
                    stats['successful_moves'] += 1
                
                print(f"    ✅  {'Would move' if dry_run else 'Moved'} successfully\n")
                
            except Exception as e:
                print(f"    ❌  Error: {e}\n")
                stats['failed_moves'] += 1
        
        return stats
    
    def create_directory_structure(self):
        """Create recommended directory structure"""
        directories = [
            # Backend structure
            "backend/api",
            "backend/api/routes",
            "backend/api/middleware", 
            "backend/core",
            "backend/core/config",
            "backend/core/database",
            "backend/models",
            "backend/services",
            "backend/utils",
            "backend/scripts",
            "backend/tests",
            "backend/deployment",
            "backend/config",
            
            # Frontend structure  
            "frontend/src",
            "frontend/src/components",
            "frontend/src/components/common",
            "frontend/src/components/pages",
            "frontend/src/hooks",
            "frontend/src/services",
            "frontend/src/utils",
            "frontend/src/stores",
            "frontend/src/styles",
            "frontend/src/assets",
            "frontend/public",
            "frontend/build",
            "frontend/tests",
            
            # Other directories
            "docs",
            "docs/api",
            "docs/deployment", 
            "docs/guides",
            "configs",
            "logs"
        ]
        
        print("Creating directory structure...")
        for directory in directories:
            dir_path = self.root_path / directory
            dir_path.mkdir(parents=True, exist_ok=True)
            print(f"✅ Created: {directory}")
    
    def generate_report(self) -> str:
        """Generate comprehensive organization report"""
        current_files = self.analyze_current_structure()
        moves = self.create_organization_plan()
        
        report = []
        report.append("# MonkeyZ File Organization Report")
        report.append("=" * 50)
        report.append("")
        
        # Current structure analysis
        report.append("## Current File Analysis")
        report.append("")
        for category, files in current_files.items():
            report.append(f"### {category.replace('_', ' ').title()}")
            for file in sorted(files):
                report.append(f"- {file}")
            report.append("")
        
        # Organization plan
        report.append("## Organization Plan")
        report.append("")
        
        by_category = {}
        for source, dest, reason in moves:
            if reason not in by_category:
                by_category[reason] = []
            by_category[reason].append((source, dest))
        
        for category, file_moves in by_category.items():
            report.append(f"### {category}")
            for source, dest in file_moves:
                source_name = Path(source).name
                dest_path = Path(dest).parent.name + "/" + Path(dest).name
                report.append(f"- {source_name} → {dest_path}")
            report.append("")
        
        # Recommendations
        report.append("## Recommendations")
        report.append("")
        report.append("1. **Backend Structure**: Organize Python files into logical modules")
        report.append("2. **Frontend Structure**: Implement component-based architecture")
        report.append("3. **Documentation**: Centralize all documentation in docs/")
        report.append("4. **Configuration**: Move config files to appropriate folders")
        report.append("5. **Testing**: Separate test files into test directories")
        report.append("")
        
        # Performance files
        report.append("## New Performance Files Added")
        report.append("")
        report.append("- `frontend/public/sw-optimized.js` - Ultra-fast service worker")
        report.append("- `frontend/src/utils/reactOptimizer.js` - React performance optimizer")  
        report.append("- `frontend/src/utils/performanceOptimizerNew.js` - Advanced performance utilities")
        report.append("- `backend/utils/backendOptimizer.py` - Backend performance optimization")
        report.append("- `backend/utils/databaseOptimizer.py` - Database performance optimization")
        report.append("")
        
        return "\n".join(report)
    
    def create_gitignore_files(self):
        """Create appropriate .gitignore files"""
        
        # Backend .gitignore
        backend_gitignore = """
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Environment
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Database
*.db
*.sqlite
*.sqlite3

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
"""
        
        # Frontend .gitignore  
        frontend_gitignore = """
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production build
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Cache
.cache/
.parcel-cache/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
"""
        
        # Write .gitignore files
        with open(self.backend_path / ".gitignore", "w") as f:
            f.write(backend_gitignore.strip())
        
        with open(self.frontend_path / ".gitignore", "w") as f:
            f.write(frontend_gitignore.strip())
        
        print("✅ Created .gitignore files for backend and frontend")


def main():
    """Main execution function"""
    root_path = r"c:\Users\User\OneDrive\שולחן העבודה\מסמכים\GitHub\MonkeyZ"
    
    organizer = MonkeyZFileOrganizer(root_path)
    
    print("🚀 MonkeyZ File Organization Tool")
    print("=" * 50)
    
    # Create directory structure
    organizer.create_directory_structure()
    print()
    
    # Generate and display report
    report = organizer.generate_report()
    
    # Save report
    with open(organizer.root_path / "FILE_ORGANIZATION_REPORT.md", "w", encoding="utf-8") as f:
        f.write(report)
    
    print("📊 Organization report saved to FILE_ORGANIZATION_REPORT.md")
    print()
    
    # Show summary
    current_files = organizer.analyze_current_structure()
    total_files = sum(len(files) for files in current_files.values())
    
    print(f"📁 Total files analyzed: {total_files}")
    print()
    
    # Execute dry run
    print("🔍 Executing dry run...")
    stats = organizer.execute_organization(dry_run=True)
    
    print(f"""
📈 Organization Summary:
- Files to move: {stats['planned_moves']}
- Would succeed: {stats['successful_moves']}  
- Would skip: {stats['skipped_moves']}
- Would fail: {stats['failed_moves']}
""")
    
    # Create .gitignore files
    organizer.create_gitignore_files()
    
    print("✅ File organization analysis complete!")
    print("📝 Review FILE_ORGANIZATION_REPORT.md for details")
    print("🔧 Run with dry_run=False to execute actual moves")


if __name__ == "__main__":
    main()
