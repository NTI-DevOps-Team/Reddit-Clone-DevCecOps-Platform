pipeline {
  agent any

  environment {
    AWS_REGION        = "us-east-1"
    EKS_CLUSTER_NAME  = "my-eks-cluster"
    ECR_REPO          = "734468801857.dkr.ecr.us-east-1.amazonaws.com/my-ecr-repo"
    IMAGE_TAG         = "${BUILD_NUMBER}"
    K8S_NAMESPACE     = "reddit"
    GIT_REPO          = "github.com/NTI-DevOps-Team/Reddit-K8s-Deployment.git"
  }

  stages {

    stage('Checkout App Code') {
      steps {
        checkout scm
      }
    }
/*
    stage('Build Docker Image') {
      steps {
        withCredentials([file(credentialsId: 'firebase-config', variable: 'ENV_FILE')]) {
          sh '''
            set -a
            . "$ENV_FILE"
            set +a

            docker build \
              --build-arg NEXT_PUBLIC_FIREBASE_API_KEY \
              --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
              --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID \
              --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
              --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
              --build-arg NEXT_PUBLIC_FIREBASE_APP_ID \
              --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID \
              -t $ECR_REPO:$IMAGE_TAG .
          '''
        }
      }
    }

    stage('Trivy Image Scan') {
      steps {
        sh '''
          trivy image \
            --exit-code 0 \
            --severity HIGH,CRITICAL \
            --format json \
            --output trivy-image-report.json \
            $ECR_REPO:$IMAGE_TAG
        '''
        archiveArtifacts artifacts: 'trivy-image-report.json', fingerprint: true
      }
    }

    stage('Login to ECR') {
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-cred'
        ]]) {
          sh '''
            aws ecr get-login-password --region $AWS_REGION |
            docker login --username AWS --password-stdin $ECR_REPO
          '''
        }
      }
    }

    stage('Push Image to ECR') {
      steps {
        sh 'docker push $ECR_REPO:$IMAGE_TAG'
      }
    }
*/
    stage('Update Deployment Image (GitOps)') {
      steps {
        sh '''
          rm -rf Reddit-K8s-Deployment
          git clone https://$GIT_REPO
          cd Reddit-K8s-Deployment

          sed -i "s|image:.*|image: $ECR_REPO:$IMAGE_TAG|g" deployment.yaml
        '''
      }
    }

    stage('Commit & Push Deployment Repo') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'git-cred',
          usernameVariable: 'GIT_USER',
          passwordVariable: 'GIT_PASS'
        )]) {
          sh '''
            cd Reddit-K8s-Deployment

            git config user.email "jenkins@gmail.com"
            git config user.name "Jenkins CI"

            git add deployment.yaml
            git diff --cached --quiet || git commit -m "Update image to $IMAGE_TAG"

            git remote remove jenkins || true
            git remote add jenkins https://$GIT_USER:$GIT_PASS@$GIT_REPO
            git push jenkins HEAD:main
          '''
        }
      }
    }

    stage('Deploy to EKS') {
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-cred'
        ]]) {
          sh '''
            aws eks update-kubeconfig \
              --region $AWS_REGION \
              --name $EKS_CLUSTER_NAME

            kubectl apply -f Reddit-K8s-Deployment/deployment.yaml -n $K8S_NAMESPACE
          '''
        }
      }
    }

    stage('Verify Rollout') {
      steps {
        sh '''
          kubectl rollout status deployment/reddit-app -n $K8S_NAMESPACE
          kubectl get pods -n $K8S_NAMESPACE
        '''
      }
    }
  }

  post {
    success {
      echo "🚀 Reddit app deployed successfully!"
    }
    failure {
      echo "❌ Pipeline failed"
    }
  }
}
