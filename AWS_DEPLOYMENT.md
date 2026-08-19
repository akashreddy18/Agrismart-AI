# AWS Deployment Guide: AgriSmart AI

Production-grade deployment blueprint for deploying the AgriSmart AI multi-container application on Amazon Web Services (AWS) using **ECS Fargate** (Serverless Containers) and managed DB/cache resources.

---

## 1. Production Architecture Overview

For a secure, highly-available, and scalable production deployment on AWS, we decouple database and caching layers from EC2 containers:

```
                  [ Internet ]
                       │
             [ Route 53 (DNS / SSL) ]
                       │
         [ Application Load Balancer ]
                       │
       ┌───────────────┴───────────────┐
       ▼ (Port 80)                     ▼ (Port 8000)
┌────────────────────────┐      ┌────────────────────────┐
│  ECS Fargate Task      │      │  ECS Fargate Task      │
│  agrismart-frontend    │      │  agrismart-backend     │
└────────────────────────┘      └────────────────────────┘
       │                               │
       └───────────────┬───────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
 ┌───────────────┐           ┌───────────────┐
 │  RDS Postgres │           │  ElastiCache  │
 │  (Database)   │           │    (Redis)    │
 └───────────────┘           └───────────────┘
```

---

## 2. Prerequisites
1. Installed AWS CLI configured with administrator credentials.
2. Installed Docker locally to build and tag container images.
3. Domain name registered on Route 53.

---

## 3. Step-by-Step Deployment Instructions

### Step 3.1: Create AWS Managed Services
We use AWS managed database and caching services for automatic backups and scalability.

1.  **RDS PostgreSQL Instance**:
    *   Create a PostgreSQL DB instance in RDS (Version 15+).
    *   Allocate database name: `agrismart_db`.
    *   Create master credentials: `agrismart_user` / `secure_aws_password`.
2.  **Amazon ElastiCache Redis Cluster**:
    *   Create a serverless or standard Redis cluster.
    *   Record the primary endpoint URL.

---

### Step 3.2: Push Images to Amazon Elastic Container Registry (ECR)
Create ECR repositories to store the backend and frontend Docker builds.

```powershell
# Authenticate local Docker daemon against AWS ECR Registry
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 1. Build and Push Backend Container
aws ecr create-repository --repository-name agrismart-backend --region us-east-1
docker build -t agrismart-backend ./backend
docker tag agrismart-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-backend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-backend:latest

# 2. Build and Push Frontend Container
aws ecr create-repository --repository-name agrismart-frontend --region us-east-1
docker build -t agrismart-frontend ./frontend
docker tag agrismart-frontend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-frontend:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-frontend:latest
```

---

### Step 3.3: Set Up Amazon Elastic Container Service (ECS)

1.  **Create ECS Cluster**:
    *   Navigate to ECS Console $\rightarrow$ **Create Cluster** $\rightarrow$ Name it `agrismart-cluster`.
2.  **Define IAM Execution Roles**:
    *   Ensure the ECS task execution role (`ecsTaskExecutionRole`) has policy permissions for pulling images from ECR and pulling environment variables from AWS Systems Manager (SSM) Parameter Store.
3.  **Register ECS Task Definitions**:
    *   Create a Fargate Task Definition (e.g. 1 vCPU, 2GB RAM).
    *   Add Container 1: `backend` pointing to `<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-backend:latest`. Map port `8000`. Inject environment variables:
        *   `DATABASE_URL`: `postgresql+asyncpg://agrismart_user:secure_aws_password@<RDS_ENDPOINT>:5432/agrismart_db`
        *   `REDIS_URL`: `redis://<REDIS_ENDPOINT>:6379/0`
    *   Add Container 2: `frontend` pointing to `<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/agrismart-frontend:latest`. Map port `80`.
4.  **Launch ECS Services**:
    *   Deploy the tasks under Fargate serverless launch type inside private VPC subnets.
    *   Associate an **Application Load Balancer (ALB)** to route port 80 requests to the frontend task port 80, and route `/api/*` context paths to the backend task port 8000.
