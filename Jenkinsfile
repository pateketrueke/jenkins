node {
  // append the nodejs' path to our PATH
  env.PATH="${tool 'Node 8.x'}/bin:${env.PATH}"
}

pipeline {
  agent any
  stages {
    stage('ENV') {
      environment {
        // extract custom secrets from project settings
        CODECOV_TOKEN = credentials('CODECOV_TOKEN')
      }
      steps {
        script {
          // export given secrets
          env.CODECOV_TOKEN = CODECOV_TOKEN
        }
      }
    }
  }
}

// execute scripts through
simpleTravisRunner('.travis.yml')
