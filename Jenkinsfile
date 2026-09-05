pipeline {

    agent any

    stages {

        stage("Checkout") {

            steps {

                checkout scm
            }
        }

        stage("Python Dependencies") {

            steps {

                sh """
                    python3 -m venv .venv

                    . .venv/bin/activate

                    pip install -r backend/requirements.txt
                """
            }
        }

        stage("Test") {

            steps {

                sh """
                    . .venv/bin/activate

                    cd backend

                    pytest
                """
            }
        }

        stage("Maven Build") {

            steps {

                sh "mvn validate"
            }
        }

        stage("Docker Build") {

            steps {

                sh "docker compose build"
            }
        }

        stage("Deploy") {

            steps {

                sh "docker compose up -d"
            }
        }

        stage("Health Check") {

            steps {

                sh """
                    sleep 15

                    curl -f \
                    http://localhost:5000/health
                """
            }
        }
    }
}
