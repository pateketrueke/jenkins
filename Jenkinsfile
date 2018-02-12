node {
  // append the nodejs' path to our PATH
  env.PATH="${tool 'Node 8.x'}/bin:${env.PATH}"
}

pipeline {
  agent any
  stages {
    stage('ENV') {
      steps {
        // set some travis-ci environment vars
        script {
          env.TRAVIS_BRANCH = "${env.GIT_BRANCH}"
          env.TRAVIS_BUILD_ID = "${env.GIT_COMMIT}"
          env.TRAVIS_EVENT_TYPE = "push"
        }
      }
    }
  }
}

// execute scripts through
simpleTravisRunner('.travis.yml')
