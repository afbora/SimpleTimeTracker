// id - unique autoincrement identification of task
// project - project name or caption of the project
// name - name of tasks or caption of task
// time - keep cumulative time from beginning to STOP press
// start - we need some guide for calculate time increase
// running - task is in progress now

let tasks = {
    insert: function (name, project) {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const tasks = transaction.objectStore('tasks');
        const item = {
            name: name,
            project: project,
            time: 0,
            start: new Date(),
            created: false,
        };

        const request = tasks.add(item);

        request.onerror = function (e) {
            console.log('Error', e.target.error.name);
        };
        request.onsuccess = function (e) {
            console.log('Task added!');
        };
    },

    update: function () {
    },

    remove: function (id) {
        dbPromise
            .then(function (db) {
                const tx = db.transaction('tasks', 'readwrite');
                const store = tx.objectStore('tasks');
                store.delete(id);
                return tx.complete;
            })
            .then(function () {
                console.log('Task deleted.');
            });
    },

    removeAll: function () {
        dbPromise
            .then(function (db) {
                const tx = db.transaction('tasks', 'readwrite');
                const store = tx.objectStore('tasks');
                store.truncate();
                return tx.complete;
            })
            .then(function () {
                console.log('Tasks truncated.');
            });
    },

    resetAll: function () {
        dbPromise
            .then(function (db) {
                const tx = db.transaction('tasks', 'readonly');
                const store = tx.objectStore('tasks');
                return store.openCursor();
            })
            .then(function updateTask(cursor) {
                if (!cursor) {
                    return;
                }
                cursor.time = 0;
                return cursor.continue().then(updateTask);
            })
            .then(function () {
                console.log('Done cursoring.');
            });
    }
}

let taskInterface = {
    intervals: [],

    db: function () {
        // Check for support
        const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

        if (!indexedDB) {
            console.log("This browser doesn't support IndexedDB.");
            throw new Error();
        }

        const request = indexedDB.open('simpleTimeTracker', 2);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;

            if (!db.objectStoreNames.contains('tasks')) {
                const tasks = db.createObjectStore('tasks', {keyPath: 'id', autoIncrement: true});
                tasks.createIndex('name', 'name', {unique: false});
                tasks.createIndex('project', 'project', {unique: false});
                tasks.createIndex('time', 'time', {unique: false});
                tasks.createIndex('start', 'start', {unique: false});
                tasks.createIndex('running', 'running', {unique: false});
            }
        }

        return request;
    },

    bind: function () {
        /* common elements
         ------------------------------------------------------------------------ */

        // cancel buttons click
        $(".cancel").live("click", function (e) {
            e.preventDefault();
            $("#" + $(this).attr("rel")).hide().hide().find("input:text").val("");
            $("#form-list").show();
        });

        /* create tesk
         ------------------------------------------------------------------------ */

        // create new task
        $(".create").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();
            $("#form-create").slideDown().find("input[name='task-project-name']").focus();
        });

        // create new task > confirm click
        $("#button-create").live("click", function () {
            tasks.insert($("#form-create :input[name='task-name']").val(), $("#form-create :input[name='task-project-name']").val());
            $("#form-create").hide().find("input:text").val("");
        });

        // create new task > enter press
        $('#task-name').keydown(function (e) {
            if (e.keyCode == 13) {
                tasks.insert($("#form-create :input[name='task-project-name']").val(), $("#form-create :input[name='task-name']").val());
                $("#form-create").hide().find("input:text").val("");
            }
        });

        /* delete one task
         ------------------------------------------------------------------------ */

        // delete task
        $(".remove").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();
            $("#button-remove").attr("rel", $(this).attr("rel"));
            $("#remove-confirm").html("Are you sure? You want to <strong>delete " + ($(this).data("name") ? $(this).data("name") : 'selected item') + "</strong>?");
            $("#form-remove").show();
        });

        // delete task > confirm deletion
        $("#button-remove").live("click", function () {
            $("#form-remove").hide();
            tasks.remove($(this).attr("rel"));
        });

        /* delete all tasks
         ------------------------------------------------------------------------ */

        // remove all tasks
        $(".remove-all").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();
            $("#form-remove-all").slideDown();
        });

        // remove all tasks > confirm deletion
        $("#button-remove-all").live("click", function () {
            $("#form-remove-all").hide();
            tasks.removeAll()
        });

        /* reset all tasks
		 ------------------------------------------------------------------------ */

        // remove all tasks
        $(".reset-all").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();
            $("#form-reset-all").slideDown();
        });

        // reset all tasks > confirm deletion
        $("#button-reset-all").live("click", function () {
            $("#form-reset-all").hide();
            tasks.resetAll()
        });

        /* export all tasks
         ------------------------------------------------------------------------ */

        // export all tasks
        $(".export-all").live("click", function (e) {
            dbPromise
                .then(function (db) {
                    const tx = db.transaction('tasks', 'readonly');
                    const store = tx.objectStore('tasks');
                    return store.getAll();
                })
                .then(function (items) {
                    let out = '';
                    let len = items.result.length, i;

                    if (len > 0) {
                        for (i = 0; i < len; i++) {
                            let task = items.result[i];
                            if (task.running === true) {
                                let start = new Date(task.start);
                                let dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
                                out += task.ID + ',' + task.project + ',' + task.name + ',' + taskInterface.hms(dif);
                            } else {
                                out += task.ID + ',' + task.project + ',' + task.name + ',' + taskInterface.hms(task.time);
                            }
                            let start = new Date(task.start);
                            out += ',' + start.getFullYear() + '-' + (parseInt(start.getMonth()) + 1).toString() + '-' + start.getDate() + '\n';
                        }
                    } else {
                        out = "No tasks"
                    }

                    let link = document.createElement("a");
                    link.download = 'SimpleTimeTracker - ' + new Date(Date.now()).toLocaleString() + '.csv';
                    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(out);
                    link.click();
                });
        });


        /* update task name
         ------------------------------------------------------------------------ */

        // update task

        $(".update").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();

            const id = $(this).attr("rel");

            dbPromise
                .then(function (db) {
                    const tx = db.transaction('tasks', 'readonly');
                    const store = tx.objectStore('tasks');
                    return store.get(id);
                })
                .then(function (task) {
                    $("#form-update :input[name='task-id']").val(task.id);
                    $("#form-update :input[name='task-name']").val(task.name);
                    $("#form-update :input[name='task-project-name']").val(task.project);
                    $("#form-update :input[name='task-time']").val(taskInterface.hms(task.time));
                    $("#form-update").slideDown();
                });
        });

        // update task > save
        $("#button-update").live("click", function () {
            $("#form-update").hide();

            dbPromise
                .then(function (db) {
                    const tx = db.transaction('tasks', 'readwrite');
                    const store = tx.objectStore('tasks');
                    const item = {
                        id: $("#form-update :input[name='task-id']").val(),
                        name: $("#form-update :input[name='task-name']").val(),
                        project: $("#form-update :input[name='task-project-name']").val(),
                        time: $("#form-update :input[name='task-time']").val(),
                    };
                    store.put(item);
                    return tx.complete;
                })
                .then(function () {
                    console.log('Task updated!');
                });
        });

        /* reset task
         ------------------------------------------------------------------------ */

        $(".reset").live("click", function (e) {
            e.preventDefault();
            $(".form").hide();

            var id = $(this).attr("rel");

            dbPromise
                .then(function (db) {
                    const tx = db.transaction('tasks', 'readwrite');
                    const store = tx.objectStore('tasks');
                    const item = {
                        id: id,
                        time: 0,
                    };
                    store.put(item);
                    return tx.complete;
                })
                .then(function () {
                    console.log('Task reset!');
                });
        });


        $(".play").live("click", function (e) {
            e.preventDefault();
            taskInterface.toggleTimer($(this).attr("rel"));
        })

    },

    index: function () {
        taskInterface.db().onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');

            let out = "";
            let tasks = store.getAll();
            tasks.onsuccess = function () {
                let len = tasks.result.length, i;

                if (len > 0) {
                    for (i = 0; i < len; i++) {
                        let task = tasks.result[i];

                        out += '<p class="item' + (task.running === true ? ' running' : '') + '" id="item' + task.ID + '" rel="' + task.ID + '">';
                        out += '<label>' + task.name + '<br/><small>' + task.project + '</small></label>';
                        out += '<a href="#" class="update" rel="' + task.ID + '" title="Edit: ' + task.name + '" data-name="' + task.name + '">Edit</a> | ';
                        out += '<a href="#" class="reset" rel="' + task.ID + '" title="Reset: ' + task.name + '" data-name="' + task.name + '">Reset</a> | ';
                        out += '<a href="#" class="remove" rel="' + task.ID + '" title="Delete: ' + task.name + '" data-name="' + task.name + '">Delete</a>';

                        if (task.running === true) {
                            let start = new Date(task.start);
                            let dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
                            out += '<span class="timer">' + taskInterface.hms(dif) + '</span>';
                        } else {
                            out += '<span class="timer">' + taskInterface.hms(task.time) + '</span>';
                        }

                        out += '<a href="#" class="power play ' + (task.running === true ? 'running' : '') + '" title="Timer on/off" rel="' + task.ID + '"></a>';
                        out += '</p>';

                        if (task.running === true) {
                            taskInterface.startTask(task); // start task
                        }
                    }
                } else {
                    out = "<p class=\"notask\"><label>No tasks</label></p>"
                }

                $("#form-list").empty().append(out).show();
            };
        };
    },

    count: function () {
        let totalTime = 0;
        taskInterface.db().onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');

            let out = "";
            let tasks = store.getAll();
            tasks.onsuccess = function () {
                let len = tasks.result.length, i;

                if (len > 0) {
                    for (i = 0; i < len; i++) {
                        let task = tasks.result[i];
                        totalTime += task.time;
                    }
                }
            };
        };

        $("#total-time-counter").html(taskInterface.hms(totalTime));
    },

    init: function () {
        this.db();
        this.bind();
        this.index();
        this.count();
        this.toggleRunText();
    },


    toggleTimer: function (id) {
        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM tasks WHERE ID = ?', [id], function (tx, results) {
                if (results.rows.length > 0) {
                    var task = results.rows.item(0);
                    $('#item' + id).toggleClass('running');
                    $('#item' + id + ' .power').toggleClass('running');

                    if (task.running == true) {
                        taskInterface.stopTask(task);
                    } else {
                        taskInterface.startTask(task);
                    }

                    taskInterface.count();
                    taskInterface.toggleRunText();
                } else {
                    alert("Task " + id + " not found sorry!");
                }
            }, null);
        });
    },

    //////////////////////////////////////////////////////////////////////////////
    // start task
    //////////////////////////////////////////////////////////////////////////////

    startTask: function (task) {
        window.clearInterval(taskInterface.intervals[task.ID]); // remove timer

        var start = new Date(); // set start to NOW

        if (task.running == true) {
            start = new Date(task.start);
        } else {
            db.transaction(function (tx) {
                tx.executeSql("UPDATE tasks SET running = ?, start = ? WHERE id = ?", [1, start, task.ID], null, onError);
            });
        }

        // setup interval for counter
        taskInterface.intervals[task.ID] = window.setInterval(function () {
            var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
            $('#item' + task.ID + ' .timer').text(taskInterface.hms(dif));
        }, 500);
    },

    //////////////////////////////////////////////////////////////////////////////
    // stop task
    //////////////////////////////////////////////////////////////////////////////

    stopTask: function (task) {
        window.clearInterval(taskInterface.intervals[task.ID]); // remove timer

        var start, stop, dif = 0;

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM tasks WHERE id = ?', [task.ID], function (tx, results) {
                if (results.rows.length > 0) {
                    start = new Date(results.rows.item(0).start); // read from DB
                    stop = new Date(); // now
                    dif = Number(results.rows.item(0).time) + Math.floor((stop.getTime() - start.getTime()) / 1000); // time diff in seconds

                    $('#item' + task.ID + ' .timer').text(taskInterface.hms(dif));

                } else {
                    alert('Task ' + task.ID + ' not found!');
                }
            }, null, onError);
        });

        // update record
        db.transaction(function (tx) {
            tx.executeSql("UPDATE tasks SET running = ?, time = ? WHERE id = ?", [0, Number(dif), task.ID], null, onError);
        });

    },


    //////////////////////////////////////////////////////////////////////////////
    // toggle RUN text on icon
    //////////////////////////////////////////////////////////////////////////////

    toggleRunText: function () {
        const objectStore = transaction.objectStore("tasks");
        customerData.forEach((customer) => {
            const request = objectStore.add(customer);
            request.onsuccess = (event) => {
                // event.target.result === customer.ssn;
            };
        });

        taskInterface.db().onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['tasks'], 'readwrite');
            const store = transaction.objectStore('tasks');
        };

        db.transaction(function (tx) {
            tx.executeSql('SELECT * FROM tasks WHERE running = ?', [1], function (tx, results) {
                if (results.rows.length > 0) {
                    chrome.browserAction.setBadgeText({
                        text: 'RUN'
                    });
                } else {
                    chrome.browserAction.setBadgeText({
                        text: ''
                    });
                }
            }, null, onError);
        });
    },

    //////////////////////////////////////////////////////////////////////////////
    // convert sec to hms
    //////////////////////////////////////////////////////////////////////////////

    hms: function (secs) {
        //secs = secs % 86400; // fix 24:00:00 overlay
        var time = [0, 0, secs], i;
        for (i = 2; i > 0; i--) {
            time[i - 1] = Math.floor(time[i] / 60);
            time[i] = time[i] % 60;
            if (time[i] < 10) {
                time[i] = '0' + time[i];
            }
        }
        return time.join(':');
    },

    //////////////////////////////////////////////////////////////////////////////
    // convert h:m:s to sec
    //////////////////////////////////////////////////////////////////////////////

    sec: function (hms) {
        var t = String(hms).split(":");
        return Number(parseFloat(t[0] * 3600) + parseFloat(t[1]) * 60 + parseFloat(t[2]));
    },

    nextID: function () {
        var id = localStorage['lastid']; // get last id from local storage
        if (id == undefined) {
            id = 1; // generate first ID
        } else {
            id++; // generate next ID
        }
        localStorage['lastid'] = id; // save to localStorage
        return id;
    }

};
