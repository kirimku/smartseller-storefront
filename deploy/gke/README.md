# GKE Autopilot Deployment

This guide walks through deploying the SmartSeller Storefront (frontend) to Google Kubernetes Engine (GKE) Autopilot.

## Prerequisites
- GKE Autopilot cluster created (e.g., `us-central1`)
- `gcloud`, `kubectl`, and `docker` installed and authenticated
- A GCP project with Artifact Registry or GitHub Container Registry (GHCR)
- A GCP service account for Workload Identity (optional, if accessing other GCP APIs)

## Container Image
Build and push the image (using the repo's Dockerfile):

```bash
# Example with GHCR (current Makefile defaults)
docker build -t ghcr.io/kirimku/smartseller-storefront:latest .
docker push ghcr.io/kirimku/smartseller-storefront:latest

# Or use Artifact Registry
REGION=us
PROJECT_ID=your-project
REPO=smartseller
IMAGE=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/smartseller-storefront:latest
gcloud auth configure-docker ${REGION}-docker.pkg.dev
docker build -t ${IMAGE} .
docker push ${IMAGE}
```

Then update `deploy/gke/autopilot/deployment.yaml` image to your registry.

## Apply Manifests

```bash
# Set your project and cluster context
gcloud config set project YOUR_PROJECT_ID
gcloud container clusters get-credentials YOUR_CLUSTER_NAME --region YOUR_REGION

# Create namespace
kubectl apply -f deploy/gke/autopilot/namespace.yaml

# (Optional) Create Service Account with Workload Identity annotation
kubectl apply -f deploy/gke/autopilot/serviceaccount.yaml

# Deploy app and service
kubectl apply -f deploy/gke/autopilot/deployment.yaml
kubectl apply -f deploy/gke/autopilot/service.yaml

# Optional: Ingress
kubectl apply -f deploy/gke/autopilot/ingress.yaml
```

## Environment Variables
The storefront uses these variables:

- `PORT` (defaults to `5173` in Dockerfile): service port
- Build-time variables: `VITE_API_URL`, `VITE_TENANT_SLUG` (passed during `docker build`)

## Probes
The app exposes `/health` (200 OK). Probes are set in the deployment for readiness and liveness.

## Workload Identity
If accessing GCP APIs from the frontend, bind the Kubernetes service account in `serviceaccount.yaml` to a GCP service account with appropriate roles.

## Verify
```bash
kubectl -n smartseller get pods,svc,ingress
kubectl -n smartseller logs deploy/smartseller-storefront -c web
kubectl -n smartseller port-forward svc/smartseller-storefront 5173:5173
curl http://localhost:5173/health
```

## Notes
- Autopilot enforces resource requests/limits; adjust if needed.
- If using Artifact Registry, update `serviceaccount.yaml` and GKE Workload Identity binding.
- To change port, update Dockerfile `ENV PORT` and K8s service/deployment.