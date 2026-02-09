pipeline {
    agent any
    environment {
        AWS_REGION        = "us-east-1"
        EKS_CLUSTER_NAME = "my-eks"
          ECR_REPO          = "734468801857.dkr.ecr.us-east-1.amazonaws.com/my-ecr-repo"
        IMAGE_TAG         = "${BUILD_NUMBER}"
         SONAR_PROJECT_KEY = "reddit-3"
        K8S_NAMESPACE     = "reddit"
          GIT_REPO = "https://github.com/NTI-DevOps-Team/Reddit-K8s-Deployment.git"
        
    }
     
    stages {
        


        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                    sonar-scanner \
                      -Dsonar.projectKey=$SONAR_PROJECT_KEY \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/**,.next/**,coverage/**
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

stage('OWASP Dependency Check') {
  steps {
    sh '''
      mkdir -p /var/jenkins_home/.dependency-check
      mkdir -p /var/jenkins_home/reports

      docker run --rm \
        -v /var/jenkins_home/workspace/$JOB_NAME:/src \
        -v /var/jenkins_home/reports:/report \
        -v /var/jenkins_home/.dependency-check:/root/.dependency-check \
        owasp/dependency-check \
        --project reddit-app \
        --scan /src \
        --format XML \
        --out /report
    '''
  }
}



 stage('Build Docker Image') {
            steps {
                withCredentials([
                    file(credentialsId: 'firebase-config', variable: 'ENV_FILE')
                ]) {
                    sh '''
                      echo "Loading env vars from secret file..."

                      set -a
                      . "$ENV_FILE"
                      set +a

                      echo "Building docker image..."

                      docker build \
                        --build-arg NEXT_PUBLIC_FIREBASE_API_KEY \
                        --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN \
                        --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID \
                        --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET \
                        --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID \
                        --build-arg NEXT_PUBLIC_FIREBASE_APP_ID \
                        --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID \
                        -t reddit-nextjs-app .
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
        aws ecr get-login-password --region $AWS_REGION \
        | docker login --username AWS --password-stdin $ECR_REPO
      '''
    }
  }
}

stage('Push Image to ECR') {
  steps {
    sh '''
      docker push $ECR_REPO:$IMAGE_TAG
    '''
  }
}

stage('Update Deployment Image') {
  steps {
    sh '''

     git clone https://github.com/NTI-DevOps-Team/Reddit-K8s-Deployment.git
     
      sed -i "s|^[[:space:]]*image:.*|    image: $ECR_REPO:$IMAGE_TAG|g" deployment.yaml

    '''
  }
}

      stage('Commit & Push Deployment') {
  steps {
    withCredentials([usernamePassword(credentialsId: 'git-cred', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_PASS')]) {
      sh '''
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


       

    }
    post {
        success {
            echo "reddit-app deployed successfully to namespace reddit"
        }
        failure {
            echo "Pipeline failed"
        }
        
    
}
}
