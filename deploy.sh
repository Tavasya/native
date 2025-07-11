#!/bin/bash

# Build and deploy the LiveKit agent to Google Cloud Run
echo "Building and deploying LiveKit agent..."

# Set environment variables
export LIVEKIT_URL="wss://nativewebserver-534nsmp8.livekit.cloud"
export LIVEKIT_API_KEY="APIMeKq8mrmU6n5"
export LIVEKIT_API_SECRET="fHdueZwHo6zaRv1Y9jxm7fXmFiliLe9xLlfWhAPn53kB"
export OPENAI_API_KEY="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"
export DEEPGRAM_API_KEY="b0bdf3d5fed47124f470623d838320ba6353ecb3"
export CARTESIA_API_KEY="sk_car_cwj71feBQp79pdjmKtvTyp"
# Deploy to Cloud Run
gcloud run deploy livekit-agent \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars LIVEKIT_URL=$LIVEKIT_URL,LIVEKIT_API_KEY=$LIVEKIT_API_KEY,LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET,OPENAI_API_KEY=$OPENAI_API_KEY,DEEPGRAM_API_KEY=$DEEPGRAM_API_KEY,CARTESIA_API_KEY=$CARTESIA_API_KEY \
    --memory 2Gi \
    --cpu 2 \
    --min-instances 1 \
    --max-instances 3 \
    --timeout 900 \
    --no-cpu-throttling \
    --execution-environment gen2

echo "Deployment completed!"