pipeline {
  agent any
  stages {
    stage('ENV') {
      steps {
        sh 'echo 42'
      }
    }
  }
}

simpleTravisRunner('.travis.yml')
