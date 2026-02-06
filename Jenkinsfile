pipeline {
    agent any

    stages {
        stage('Build Docker Image') {
            steps {
                withCredentials([
                    file(credentialsId: 'nextjs-build-env', variable: 'ENV_FILE')
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
    }
}
