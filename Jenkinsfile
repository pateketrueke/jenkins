pipeline {
  agent any
  stages {
    stage('github => pending') {
      steps {
        githubNotify status: 'PENDING'
      }
    }
    stage('ENV') {
      steps {
        sh 'echo 42'
      }
    }
    post {
      success {
        githubNotify status: 'SUCCESS'
      }
      failure {
        githubNotify status: 'FAILURE'
      }
    }
  }
}
