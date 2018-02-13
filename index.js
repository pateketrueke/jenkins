'use strict';

require('dotenv').config();
require('moment.distance');

const moment = require('moment');
const Jenkins = require('jenkins');
const blessed = require('blessed');
const contrib = require('blessed-contrib');

let projectLog;
let projectInfo = [];
let projectOffset = 0;

const jenkins = new Jenkins({
  baseUrl: process.env.JENKINS_URL,
  promisify: true,
  crumbIssuer: true,
});

const TABLE_CONFIG = {
  fg: 'white',
  selectedFg: 'white',
  selectedBg: 'blue',
  interactive: true,
  keys: true,
  label: 'Available projects',
  width: '100%',
  height: '40%',
  border: {
    type: 'line',
    fg: 'cyan',
  },
  noCellBorders: false,
  fillCellBorders: true,
  columnSpacing: 4,
  columnWidth: [60, 6, 10, 30, 24, 4],
};

const TABLE_HEADERS = ['Name', 'Health', 'Result', 'Duration', 'Date', 'Job'];

function durationTime(diff) {
  const duration = moment.duration(diff);

  return `${duration.humanize()} (${moment.utc(duration.asMilliseconds()).format('HH:mm:ss')})`;
}

function formatLog(text) {
  return text.replace(/.*\[Pipeline\].*/g, '\x1b[90m$&\x1b[0m');
}

function queue(callback) {
  return Promise.resolve()
    .then(() => callback())
    .catch(e => {
      process.stdout.write(e.toString());
    });
}

function main() {
  const screen = blessed.screen();
  const table = contrib.table(TABLE_CONFIG);

  screen.append(table);

  function displayLogs() {
    const info = projectInfo[projectOffset];

    if (!projectLog && info) {
      screen.remove(table);
      screen.program.clear();

      projectLog = jenkins.build.logStream(info.jobs[0].fullName, info.jobs[0].lastBuild.number);

      projectLog.on('error', e => {
        process.stdout.write(e.toString());
        process.exit(1);
      });

      projectLog.on('data', text => process.stdout.write(formatLog(text)));
    }
  }

  function drawJobs() {
    const data = [];

    projectInfo.forEach((stats, key) => {
      const fields = [
        stats.name,
        stats.healthReport.length
          ? stats.healthReport[0].score
          : '',
      ];

      if (stats.jobs.length) {
        fields[0] = stats.jobs[0].fullDisplayName;
        fields.push(stats.jobs[0].lastBuild.result || 'PENDING');
        fields.push(stats.jobs[0].lastBuild.duration
          ? moment.duration(stats.jobs[0].lastBuild.duration).humanize()
          : durationTime(new Date() - stats.jobs[0].lastBuild.timestamp));
        fields.push(projectOffset !== key
          ? moment(stats.jobs[0].lastBuild.timestamp).format('MMM Do YYYY (HH:MM:ss)')
          : moment.duration(new Date() - stats.jobs[0].lastBuild.timestamp).distance());
        fields.push(stats.jobs[0].lastBuild.number);
      }

      data.push(fields);
    });

    table.setData({
      headers: TABLE_HEADERS,
      data,
    });
  }

  function redraw() {
    drawJobs();

    table.focus();
    screen.render();
  }

  function getInfo() {
    queue(() => jenkins.info({ tree: 'jobs[name]' }))
      .then(data => {
        return Promise.all(data.jobs.map(x => {
          return queue(() => jenkins.job.get(x.name, {
            tree: [
              'name,description,healthReport[description,score],jobs[name,fullName,fullDisplayName,color,fullDisplayName',
              'nextBuildNumber,lastBuild[number,duration,timestamp,result]]',
            ].join(','),
          }));
        })).then(results => {
          projectInfo = results;
          redraw();

          if (!projectLog) {
            setTimeout(getInfo, 1000);
          }
        });
      });
  }

  function checkEscape(key) {
    if (projectLog) {
      if (key.name === 'escape') {
        projectLog.end();
        projectLog = null;
        projectOffset = 0;
        screen.program.clear();
        screen.destroy();
        main();
      }

      return true;
    }
  }

  screen.key(['up', 'down', 'enter', 'c', 's'], (ch, key) => {
    if (checkEscape(key)) {
      return;
    }

    const job = projectInfo[projectOffset]
      ? projectInfo[projectOffset].jobs[0]
      : null;

    const build = job && job.lastBuild;

    switch (key.name) {
      case 'up':
        if (projectOffset > 0) {
          projectOffset -= 1;
          redraw();
        }
        break;

      case 'down':
        if (projectOffset < (projectInfo.length - 1)) {
          projectOffset += 1;
          redraw();
        }
        break;

      case 'enter':
        displayLogs();
        break;

      case 'c':
        if (build && build.result === null) {
          queue(() => jenkins.build.stop(job.fullName, build.number));
        }
        break;

      default:
        if (build) {
          queue(() => jenkins.job.build(job.fullName));
        }
        break;
    }
  });

  screen.key(['escape', 'C-c', 'q'], (ch, key) => {
    if (!checkEscape(key)) {
      return process.exit(0);
    }
  });

  screen.render();

  getInfo();
}

main();
