var db = openDatabase('simpletimetracker', '', 'Simple Time tracker database', 2 * 1024 * 1024);

// id - unique autoincrement identificator of task
// project_name - project name or caption of the project
// name - name of taks or caption of task
// time - keep cumulative time from begining to STOP press
// start - we need some guide for calculate time increase
// running - task is in progress now

db.changeVersion('', '2.0', function (tx) {
	tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(ID INTEGER PRIMARY KEY ASC, project_name TEXT, name TEXT, time INTEGER, start DATETIME, running BOOLEAN)', [], null, onError); // table creation
});

// 1.0 => 2.0
if (db.version == '1.0' || db.version == '1.1') 
{
	db.changeVersion(db.version, '2.0', function (tx) {
		tx.executeSql("ALTER TABLE tasks ADD project_name TEXT AFTER ID");
	});
}

/**
 * Delete all records (drop table)
 */
function dropTaskTable() 
{
	db.transaction(function (tx) {
		tx.executeSql("DROP TABLE tasks", [], function (tx, results) {
			alert('Table tasks was droped');
		}, onError);
	});
}
// dropTaskTable();

/**
 * Exception hook
 */
function onError(tx, error) 
{
	alert(error.message);
}

var tasks = {

	insert: function (id, project_name, name) {
		db.transaction(function (tx) {
			tx.executeSql("INSERT INTO tasks (id, project_name, name, time, start, running) VALUES (?, ?, ?, ?, ?, ?)", [id, project_name, name, 0, new Date(), false],
					function (tx, result) {
						taskInterface.index();
					},
					onError);
		});
	},

	update: function () {

	},

	remove: function (id) {
		db.transaction(function (tx) {
			tx.executeSql("DELETE FROM tasks WHERE id=?", [id],
					function (tx, result) {
						window.clearInterval(taskInterface.intervals[id]);
						taskInterface.index();
					},
					onError);
		});
	},

	removeall: function () {
		db.transaction(function (tx) {
			tx.executeSql("DELETE FROM tasks", [], function (tx, results) {

				for (iid in taskInterface.intervals) {
					window.clearInterval(taskInterface.intervals[iid]);
				}

				taskInterface.index();
			}, onError);
		});
	},
    
    resetall: function () {
		db.transaction(function (tx) {
			tx.executeSql("UPDATE tasks SET time = ?", [0], function (tx, results) {
				taskInterface.index();
			}, onError);
		});
	}
}

var taskInterface = {

	intervals: new Array,

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
			tasks.insert(taskInterface.nextID(), $("#form-create :input[name='task-project-name']").val(), $("#form-create :input[name='task-name']").val());
			$("#form-create").hide().find("input:text").val("");
		});

		// create new task > enter press
		$('#task-name').keydown(function (e) {
			if (e.keyCode == 13) {
				tasks.insert(taskInterface.nextID(), $("#form-create :input[name='task-project-name']").val(), $("#form-create :input[name='task-name']").val());
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
            tasks.removeall()
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
            tasks.resetall()
		});

		/* export all tasks
		 ------------------------------------------------------------------------ */

		// export all tasks
		$(".export-all").live("click", function (e) {
			db.transaction(function (tx) {
				tx.executeSql('SELECT * FROM tasks ORDER BY id DESC', [], function (tx, results) {
					var out = '';
					var len = results.rows.length, i;

					if (len > 0) {
						for (i = 0; i < len; i++) {
							var task = results.rows.item(i);
							if (task.running == true) {
								var start = new Date(task.start);
								var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
								out += task.ID + ',' + task.project_name + ',' + task.name + ',' + taskInterface.hms(dif);
							} else {
								out += task.ID + ',' + task.project_name + ',' + task.name + ',' + taskInterface.hms(task.time);
							}
							var start = new Date(task.start);
							out += ',' + start.getFullYear() + '-' + (parseInt(start.getMonth()) + 1).toString() + '-' + start.getDate() + '\n';
						}
					} else {
						out = "No tasks"
					}

					var link = document.createElement("a");
					link.download = 'SimpleTimeTracker - '  +new Date(Date.now()).toLocaleString()  + '.csv';
					link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(out);
					link.click();

				}, null);
			});
		});


		/* update task name
		 ------------------------------------------------------------------------ */

		// update task

		$(".update").live("click", function (e) {
			e.preventDefault();
			$(".form").hide();

			var id = $(this).attr("rel");
			// TODO load function
			db.transaction(function (tx) {
				tx.executeSql('SELECT * FROM tasks WHERE ID = ?', [id], function (tx, results) {

					if (results.rows.length > 0) {
						$("#form-update :input[name='task-id']").val(id);
						$("#form-update :input[name='task-project-name']").val(results.rows.item(0).project_name);
						$("#form-update :input[name='task-name']").val(results.rows.item(0).name);
						$("#form-update :input[name='task-time']").val(taskInterface.hms(results.rows.item(0).time));
						$("#form-update").slideDown();
					} else {
						alert("Task " + id + "not found!");
					}
				}, null);
			});
		});

		// update task > save
		$("#button-update").live("click", function () {
			$("#form-update").hide();

			var id = $("#form-update :input[name='task-id']").val(); // get id
			var project_name = $("#form-update :input[name='task-project-name']").val(); // get name
			var name = $("#form-update :input[name='task-name']").val(); // get name
			var time = $("#form-update :input[name='task-time']").val(); // get task time

			db.transaction(function (tx) {
				tx.executeSql("UPDATE tasks SET project_name = ?, name = ?, time = ? WHERE id = ?", [project_name, name, taskInterface.sec(time), id], function (tx, results) {
					taskInterface.index();
				}, onError);
			});
		});

		/* reset task
		 ------------------------------------------------------------------------ */

		$(".reset").live("click", function (e) {
			e.preventDefault();
			$(".form").hide();

			var id = $(this).attr("rel");

			db.transaction(function (tx) {
				tx.executeSql("UPDATE tasks SET time = ? WHERE id = ?", [0 , id], function (tx, results) {
					taskInterface.index();
				}, onError);
			});

		});


		$(".play").live("click", function (e) {
			e.preventDefault();
			taskInterface.toggleTimer($(this).attr("rel"));
		})

	},

	index: function () {
		var out = "";

		db.transaction(function (tx) {
			tx.executeSql('SELECT * FROM tasks ORDER BY id DESC', [], function (tx, results) {

				var len = results.rows.length, i;

				if (len > 0) {
					for (i = 0; i < len; i++) {
						var task = results.rows.item(i);

						out += '<p class="item' + (task.running == true ? ' running' : '') + '" id="item' + task.ID + '" rel="' + task.ID + '">';
						out += '<label>' + task.name + '<br/><small>' + task.project_name + '</small></label>';
						out += '<a href="#" class="update" rel="' + task.ID + '" title="Edit: ' + task.name + '" data-name="' + task.name + '">Edit</a> | ';
						out += '<a href="#" class="reset" rel="' + task.ID + '" title="Reset: ' + task.name + '" data-name="' + task.name + '">Reset</a> | ';
						out += '<a href="#" class="remove" rel="' + task.ID + '" title="Delete: ' + task.name + '" data-name="' + task.name + '">Delete</a>';

						if (task.running == true) {
							var start = new Date(task.start);
							var dif = Number(task.time) + Math.floor((new Date().getTime() - start.getTime()) / 1000)
							out += '<span class="timer">' + taskInterface.hms(dif) + '</span>';
						} else {
							out += '<span class="timer">' + taskInterface.hms(task.time) + '</span>';
						}

						out += '<a href="#" class="power play ' + (task.running == true ? 'running' : '') + '" title="Timer on/off" rel="' + task.ID + '"></a>';
						out += '</p>';

						if (task.running == true) {
							taskInterface.startTask(task); // start task
						}
					}
				} else {
					out = "<p class=\"notask\"><label>No tasks</label></p>"
				}

				$("#form-list").empty().append(out).show();

			}, null);
		});
	},

	init: function () {
		this.bind();
		this.index();
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
