// id - unique autoincrement identification of task
// project - project name or caption of the project
// name - name of tasks or caption of task
// time - keep cumulative time from beginning to STOP press
// start - we need some guide for calculate time increase
// running - task is in progress now

let tasks = {
  insert: async function (item) {
    const task = {
      time: 0,
      start: new Date(),
      running: 0,
      rate: "",
      notes: "",
      ...item
    };

    await taskInterface.db.insert({
      into: "tasks",
      values: [task]
    });

    await taskInterface.reload();
  },

  update: async function (item, where = {}) {
    const data = {
      in: "tasks",
      set: item
    };

    if (Object.keys(where).length) {
      data.where = where;
    }

    await taskInterface.db.update(data);
  },

  remove: async function (id) {
    await taskInterface.db.remove({
      from: "tasks",
      where: {
        id: parseInt(id)
      }
    });

    await taskInterface.reload();
  },

  removeAll: async function () {
    await taskInterface.db.clear("tasks");
    await taskInterface.reload();
  },

  resetAll: async function () {
    await this.update({
      time: 0,
    })

    await taskInterface.reload();
  },

  reset: async function (id) {
    await this.update(
      {
        time: 0,
        start: new Date()
      },
      {
        id: parseInt(id)
      });

    await taskInterface.reload();
  }
}

let taskInterface = {
  db: null,
  options: null,
  intervals: [],

  initDb: async function () {
    let tasks = {
      name: "tasks",
      columns: {
        id: {primaryKey: true, autoIncrement: true},
        name: {dataType: "string"},
        project: {dataType: "string"},
        time: {dataType: "number"},
        start: {dataType: "date_time"},
        running: {dataType: "number"},
        rate: {dataType: "string"},
        notes: {dataType: "string"}
      }
    }

    let migration = {
      name: "migration",
      columns: {
        id: {primaryKey: true, autoIncrement: true},
        date: {dataType: "date_time"}
      }
    }

    let db = {
      name: "simpleTimeTracker",
      tables: [tasks, migration],
      version: 2
    }

    const connection = new JsStore.Connection();
    await connection.initDb(db);

    this.db = connection;
  },

  /**
   * @todo Remove migration in v3
   */
  migrate: async function () {
    if (typeof openDatabase === 'function') {
      let results = await this.db.count({
        from: "migration"
      });

      // check migrated before
      if (results === 0) {
        // open old db
        let db = openDatabase('simpletimetracker', '', 'Simple Time tracker database', 2 * 1024 * 1024);

        // create table if not exists
        db.transaction(function (tx) {
          tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(ID INTEGER PRIMARY KEY ASC, project_name TEXT, name TEXT, time INTEGER, start DATETIME, running BOOLEAN)', [], null, this.onError); // table creation
        });

        // get records and insert to new db
        db.transaction(function (tx) {
          tx.executeSql('SELECT * FROM tasks ORDER BY ID DESC', [], async function (tx, results) {
            let len = results.rows.length, i;
            if (len > 0) {
              for (i = 0; i < len; i++) {
                const task = results.rows.item(i);

                await tasks.insert({
                  name: String(task.name),
                  project: String(task.project_name),
                  time: parseInt(task.time),
                  start: new Date(taskInterface.start),
                  running: parseInt(task.running),
                  rate: "",
                  notes: ""
                });
              }
            }
          }, this.onError);
        });

        // drop table
        db.transaction(function (tx) {
          tx.executeSql("DROP TABLE tasks", [], null, this.onError);
        });

        // add migration date to check
        await taskInterface.db.insert({
          into: "migration",
          values: [{date: new Date}]
        });
      }
    }
  },

  reload: async function () {
    await this.index();
    await this.count();
  },

  settings: async function () {
    if (!this.options) {
      const self = this;
      return new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get(
            {
              dynamic_tasks: false,
              sort_by: "id",
              sort_direction: "asc"
            },
            (items) => {
              self.options = items;
              resolve(items);
            }
          );
        } catch (ex) {
          reject(ex);
        }
      });
    }
  },

  bind: async function () {
    // cancel buttons click
    $(document).on("click", ".cancel", async function (e) {
      e.preventDefault();
      $("#" + $(this).attr("rel"))
        .hide()
        .hide()
        .find("input:text, textarea")
        .val("");
      taskInterface.hideError();
      $("#form-list").show();
    });

    // create new task
    $(document).on("click", ".create", async function (e) {
      e.preventDefault();
      $("#form-list").hide();
      $("#form-create").slideDown().find("input[name='task-name']").focus();
    });

    // create new task > confirm click
    $(document).on("click", "#button-create", async function (e) {
      taskInterface.hideError();

      const name = $("#form-create input[name='task-name']").val();
      const project = $("#form-create input[name='task-project']").val();

      if (name.length) {
        await tasks.insert({
          name: name,
          project: project
        });

        $("#form-create")
          .hide()
          .find("input:text, textarea")
          .val("");
      } else {
        taskInterface.showError("Task name is required!");
      }
    });

    // create new task > enter press
    $(document).on("keydown", "#task-name", async function (e) {
      if (e.keyCode === 13) {
        taskInterface.hideError();

        const name = $("#form-create :input[name='task-name']").val();
        const project = $("#form-create :input[name='task-project']").val();

        if (name.length) {
          await tasks.insert({
            name: name,
            project: project
          });

          $("#form-create")
            .hide()
            .find("input:text, textarea")
            .val("");
        } else {
          taskInterface.showError("Task name is required!");
        }
      }
    });

    // delete task
    $(document).on("click", ".remove", async function (e) {
      e.preventDefault();
      const message = "Are you sure you want to delete <strong>" + ($(this).data("name") ? $(this).data("name") : 'selected item') + "</strong>?";

      $("#form-list").hide();
      $("#button-remove").attr("rel", $(this).attr("rel"));
      $("#remove-confirm").html(message);
      $("#form-remove").show();
    });

    // delete task > confirm deletion
    $(document).on("click", "#button-remove", async function (e) {
      $("#form-remove").hide();
      await tasks.remove($(this).attr("rel"));
    });

    // remove all tasks
    $(document).on("click", ".remove-all", async function (e) {
      e.preventDefault();
      $("#form-list").hide();
      $("#form-remove-all").slideDown();
    });

    // remove all tasks > confirm deletion
    $(document).on("click", "#button-remove-all", async function (e) {
      $("#form-remove-all").hide();
      await tasks.removeAll()
    });

    // reset all tasks
    $(document).on("click", ".reset-all", async function (e) {
      e.preventDefault();
      $("#form-list").hide();
      $("#form-reset-all").slideDown();
    });

    // reset all tasks > confirm deletion
    $(document).on("click", "#button-reset-all", async function (e) {
      $("#form-reset-all").hide();
      await tasks.resetAll();
    });

    // export all tasks
    $(document).on("click", ".export-all", async function (e) {
      let results = await taskInterface.db.select({
        from: "tasks"
      });

      if (results.length) {
        let out = "";

        results.forEach(task => {
          if (task.running === 1) {
            let start = new Date(task.start);
            let dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
            out += task.id + ',' + task.project + ',' + task.name + ',' + taskInterface.hms(dif);
          } else {
            out += task.id + ',' + task.project + ',' + task.name + ',' + taskInterface.hms(task.time);
          }
          let start = new Date(task.start);
          out += ',' + start.getFullYear() + '-' + (parseInt(start.getMonth()) + 1).toString() + '-' + start.getDate();
          out += ',' + task.rate;
          out += ',' + task.notes;
          out += '\n';
        });

        let link = document.createElement("a");
        link.download = 'SimpleTimeTracker_' + new Date(Date.now()).toLocaleString() + '.csv';
        link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(out);
        link.click();
      }
    });

    $(document).on("click", ".update", async function (e) {
      e.preventDefault();
      $("#form-list").hide();

      const id = $(this).attr("rel");

      let results = await taskInterface.db.select({
        from: "tasks",
        where: {
          id: parseInt(id)
        },
        limit: 1
      });

      if (results.length) {
        results.forEach(task => {
          $("#form-update input[name='task-id']").val(task.id);
          $("#form-update input[name='task-name']").val(task.name);
          $("#form-update input[name='task-project']").val(task.project);
          $("#form-update input[name='task-time']").val(taskInterface.hms(task.time));
          $("#form-update input[name='task-rate']").val(task.rate);
          $("#form-update textarea[name='task-notes']").val(task.notes);
          $("#form-update").slideDown();
        });
      }
    });

    // update task > save
    $(document).on("click", "#button-update", async function (e) {
      taskInterface.hideError();

      const id = parseInt($("#form-update :input[name='task-id']").val());
      const name = $("#form-update input[name='task-name']").val();
      const project = $("#form-update input[name='task-project']").val();
      const time = $("#form-update input[name='task-time']").val();
      const rate = $("#form-update input[name='task-rate']").val();
      const notes = $("#form-update textarea[name='task-notes']").val();

      if (name.length) {
        await tasks.update({
          name: name,
          project: project,
          time: taskInterface.sec(time),
          rate: rate,
          notes: notes,
        }, {
          id: id
        });
        $("#form-update").hide();
        await taskInterface.reload();
      } else {
        taskInterface.showError("Task name is required!");
      }
    });

    $(document).on("click", ".reset", async function (e) {
      e.preventDefault();
      $("#form-list").hide();

      let id = $(this).attr("rel");
      await tasks.reset(id);
    });

    $(document).on("click", ".play", async function (e) {
      e.preventDefault();
      await taskInterface.toggleTimer($(this).attr("rel"));
      await taskInterface.reload();

    });

    // options modal
    $(document).on("click", ".options", async function (e) {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        window.open(chrome.runtime.getURL('options.html'));
      }
    });
  },

  index: async function () {
    let order = [];
    console.log(this.options);
    if (this.options?.dynamic_tasks) {
      order.push({
        by: "running",
        type: "desc"
      });
    }

    if (this.options?.sort_by && this.options?.sort_direction) {
      order.push({
        by: this.options.sort_by,
        type: this.options.sort_direction
      });
    }

    if (order.length === 0) {
      order.push({
        by: "id",
        type: "asc"
      });
    }

    let results = await taskInterface.db.select({
      from: "tasks",
      order: order
    });

    let out = "";

    if (results.length > 0) {
      results.forEach(task => {
        out += '<div class="item' + (task.running === 1 ? ' running' : '') + '" id="item' + task.id + '" rel="' + task.id + '">';
        out += '<div class="item-container">';
        out += '<label class="title" title="' + task.notes + '">';
        out += task.name + '<br/>';
        out += '<small>';
        out += task.project;
        if (task.rate.length) {
          out += ' / ' + task.rate;
        }
        out += '</small>';
        out += '</label>';
        out += '<a href="#" class="update" rel="' + task.id + '" title="Edit: ' + task.name + '" data-name="' + task.name + '">Edit</a> | ';
        out += '<a href="#" class="reset" rel="' + task.id + '" title="Reset: ' + task.name + '" data-name="' + task.name + '">Reset</a> | ';
        out += '<a href="#" class="remove" rel="' + task.id + '" title="Delete: ' + task.name + '" data-name="' + task.name + '">Delete</a>';

        if (task.running === 1) {
          let start = new Date(task.start);
          let dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
          out += '<span class="timer">' + taskInterface.hms(dif) + '</span>';
        } else {
          out += '<span class="timer">' + taskInterface.hms(task.time) + '</span>';
        }

        out += '<a href="#" class="power play ' + (task.running === 1 ? 'running' : '') + '" title="Timer on/off" rel="' + task.id + '"></a>';
        out += '</div>';
        out += '</div>';

        if (task.running === 1) {
          taskInterface.startTask(task); // start task
        }
      })
    } else {
      out = "<p class=\"notask\"><label>No tasks yet.</label></p>"
    }

    $("#form-list").empty().append(out).show();
  },

  count: async function () {
    let totalTime = 0;

    let results = await taskInterface.db.select({
      from: "tasks",
    });

    if (results.length > 0) {
      results.forEach(task => {
        totalTime += task.time;
      })
    }

    $("#total-time-counter").html(taskInterface.hms(totalTime));
  },

  init: async function () {
    await this.initDb();
    await this.migrate();
    await this.bind();
    await this.settings();
    await this.index();
    await this.count();
    await this.toggleRunText();
  },

  toggleTimer: async function (id) {
    let results = await taskInterface.db.select({
      from: "tasks",
      where: {
        id: parseInt(id)
      },
      limit: 1
    });

    if (results.length) {
      results.forEach(task => {
        $('#item' + id).toggleClass('running');
        $('#item' + id + ' .power').toggleClass('running');

        if (task.running === 1) {
          taskInterface.stopTask(task);
        } else {
          taskInterface.startTask(task);
        }
      });

      await taskInterface.count();
      await taskInterface.toggleRunText();
    }
  },

  startTask: async function (task) {
    // remove timer
    window.clearInterval(taskInterface.intervals[task.id]);

    let start = new Date(); // set start to NOW

    if (task.running === 1) {
      start = new Date(task.start);
    } else {
      // update record
      await tasks.update(
        {
          running: 1,
          start: start
        },
        {
          id: task.id
        }
      );
    }

    // setup interval for counter
    taskInterface.intervals[task.id] = window.setInterval(function () {
      let dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
      $('#item' + task.id + ' .timer').text(taskInterface.hms(dif));
    }, 500);
  },

  stopTask: async function (task) {
    // remove timer
    window.clearInterval(taskInterface.intervals[task.id]);

    let start, stop, dif = 0;

    start = new Date(task.start); // read from DB
    stop = new Date(); // now
    dif = Number(task.time) + Math.floor((stop.getTime() - start.getTime()) / 1000); // time diff in seconds
    $('#item' + task.id + ' .timer').text(taskInterface.hms(dif));

    // update record
    await tasks.update(
      {
        running: 0,
        time: Number(dif)
      },
      {
        id: task.id
      }
    );
  },


  toggleRunText: async function () {
    let results = await taskInterface.db.count({
      from: "tasks",
      where: {
        running: 1
      }
    });

    if (results > 0) {
      chrome.action.setBadgeText({
        text: "RUN"
      });
    } else {
      chrome.action.setBadgeText({
        text: ""
      });
    }
  },

  hms: function (secs) {
    //secs = secs % 86400; // fix 24:00:00 overlay
    let time = [0, 0, secs], i;
    for (i = 2; i > 0; i--) {
      time[i - 1] = Math.floor(time[i] / 60);
      time[i] = time[i] % 60;
      if (time[i] < 10) {
        time[i] = '0' + time[i];
      }
    }
    return time.join(':');
  },

  sec: function (hms) {
    let t = String(hms).split(":");
    return Number(parseFloat(t[0] * 3600) + parseFloat(t[1]) * 60 + parseFloat(t[2]));
  },

  hideError: function () {
    $("#form-error").html("").hide();
  },

  showError: function (message) {
    $("#form-error").html(message).show();

    setTimeout(function () {
      taskInterface.hideError();
    }, 2000);
  },

  onError: function onError(tx, error) {
    alert(error.message);
  }
};
