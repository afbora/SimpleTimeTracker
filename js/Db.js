let instance = null

export default class Db {
    db = null

    constructor() {
        if (!instance) {
            instance = this
            this.connect()
        }
        return instance
    }

    connect() {
        this.db = openDatabase('gotimetracker', '', 'GO Time tracker database', 2 * 1024 * 1024)
        if (!this.db) console.log("Ошибка базы данных")
    }

    getAllTasks(handler) {
        this.db.transaction((tx) => {
            tx.executeSql('SELECT * FROM tasks ORDER BY id DESC', [], (tx, results) => {
                results.rows.length ? handler(Object.values(results.rows)) : handler([])
            })
        })
    }

    insertTask(projectName, taskName) {
        let id = this.nextID()
        let createdAt = new Date()

        this.db.transaction((tx) => {
            tx.executeSql("INSERT INTO tasks (id, project_name, name, time, start, running, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [id, projectName, taskName, 0, new Date(), 0, createdAt],
                (tx, result) => {
                },
                this.onError)
        });
    }

    updateTask(id, projectName, taskName, time) {
        this.db.transaction((tx) => {
            tx.executeSql("UPDATE tasks SET project_name = ?, name = ?, time = ? WHERE id = ?", [projectName, taskName, time, id], null, this.onError);
        });
    }

    updateTaskState(id, running, start) {
        this.db.transaction((tx) => {
            tx.executeSql("UPDATE tasks SET running = ?, start = ? WHERE id = ?", [running, start, id], null, this.onError);
        });
    }

    resetTask(id) {
        this.db.transaction((tx) => {
            tx.executeSql("UPDATE tasks SET running = ?, time = ? WHERE id = ?", [0, 0, id], null, this.onError);
        });
    }

    nextID() {
        let id = localStorage['lastid'] // get last id from local storage
        if (id == undefined) {
            id = 1 // generate first ID
        } else {
            id++ // generate next ID
        }
        localStorage['lastid'] = id // save to localStorage
        return id
    }

    onError(tx, error) {
        alert(error)
        console.log(error)
    }
}


class SingletonModuleScopedInstance {
    constructor() {
        if (!instance) {
            instance = this
        }

        this._type = 'SingletonModuleScopedInstance';
        this.time = new Date()

        return instance;
    }

    singletonMethod() {
        return 'singletonMethod'
    }

    static staticMethod() {
        return 'staticMethod'
    }

    get type() {
        return this._type
    }

    set type(value) {
        this._type = value
    }
}