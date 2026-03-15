#!/bin/bash

# Configuration
PROJECT_ID="ai-exec-mail-assistant"
SERVICE_NAME="ai-exec-backend"
REGION="us-central1"
REPO_NAME="ai-exec"
IMAGE_TAG="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME"

# API Keys from your .env
GROQ_KEY="your_groq_api_key"
OPENROUTER_KEY="your_openrouter_api_key"

echo "Using Project ID: $PROJECT_ID"
echo "Image Tag: $IMAGE_TAG"

# 1. Set the project
gcloud config set project $PROJECT_ID

# 2. Build the container using Cloud Build
echo "Building container..."
gcloud builds submit --tag $IMAGE_TAG ./backend

# 3. Deploy to Cloud Run
echo "Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_TAG \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GROQ_API_KEY=$GROQ_KEY,OPENROUTER_API_KEY=$OPENROUTER_KEY,LLM_MODEL=groq/llama-3.1-8b-instant"

echo "Deployment complete!"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
echo "Service URL: $SERVICE_URL"
echo "Update your extension/content.js with this URL."
