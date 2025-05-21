# IMPORTANT NOTE FOR DEPLOYMENT

When deploying to DigitalOcean, the shell scripts need to be executable. Since you're developing on Windows, make sure that when the files are pushed to your Git repository, they have the proper executable permissions.

You can do this in one of two ways:

## Option 1: Git configuration (recommended)
Run this command once in your Git repository to ensure shell scripts are executable when checked out on DigitalOcean:

```
git config core.fileMode true
```

## Option 2: Use Git Bash to make files executable locally
If you have Git Bash installed, run:

```bash
cd path/to/your/repository
chmod +x frontend/do-build-simplified.sh
chmod +x frontend/do-build-express.sh
chmod +x frontend/start.sh
chmod +x frontend/verify-health-check.sh
```

## Option 3: On DigitalOcean
If you have SSH access to your DigitalOcean app, you can run:

```bash
chmod +x do-build-simplified.sh do-build-express.sh start.sh verify-health-check.sh
```

These scripts have been updated to provide better diagnostics and fallback mechanisms when deploying to DigitalOcean.
