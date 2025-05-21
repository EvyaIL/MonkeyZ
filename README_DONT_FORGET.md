# MonkeyZ Manual Steps & Deployment Notes

## 1. Environment Variables
- Make sure to set all required environment variables for both backend and frontend (see `.env.example` or `DEPLOY.md` if available).
- For DigitalOcean, set your secrets in the control panel or use a `.env` file in your droplet/container.
- Required variables (backend):
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `S3_BUCKET_NAME` (for image uploads)
  - `EMAILJS_USER`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID` (if using email)
  - Any others referenced in your code

## 2. DigitalOcean Deployment
- Use the provided `Dockerfile` and `docker-compose.yml` for containerized deployment.
- Make sure your MongoDB instance is accessible from your droplet.
- Open required ports (usually 80/443 for web, 8000 for FastAPI dev, etc).
- If using static hosting for frontend, build with `npm run build` and serve the `build/` folder.

## 3. Required Packages
- If you see errors about missing packages, install them manually:

### Backend (Python, in `backend/`):
```
pip install -r requirements.txt
```

### Frontend (Node, in `frontend/`):
```
npm install
```

#### If you see errors about missing icons:
```
npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons @fortawesome/free-regular-svg-icons @fortawesome/free-brands-svg-icons
```

#### If you see errors about file uploads:
```
npm install react-dropzone
```

## 4. Manual Admin Setup
- To make yourself admin, log into your MongoDB and set your user `role` to `0`.

## 5. Blog Comments & Likes
- Blog comments and likes require the backend endpoints to be enabled. If not present, implement them in `blog_router.py` and connect to the frontend.

## 6. S3/Image Uploads
- Make sure your AWS credentials and bucket are correct and accessible from your server.

## 7. Discord Integration
- If you want Discord login, set up OAuth credentials and update the backend accordingly.

## 8. Other
- If you deploy to DigitalOcean App Platform, set build and run commands in the dashboard.
- If you use a custom domain, update DNS records as needed.

---

**If you have any issues, check logs and make sure all environment variables are set.**
