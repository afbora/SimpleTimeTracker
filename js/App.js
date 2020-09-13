import { h, render, Component } from './preact/preact.js'
import Header from './components/Header.js'
import Content from './components/Content.js'
import Footer from './components/Footer.js'

console.log('sdfsdf')

let db = openDatabase('gotimetracker', '', 'GO Time tracker database', 2 * 1024 * 1024)
checkDb()

if (!db) console.log("Ошибка базы данных")

class App extends Component {
    constructor() {
		super()
		this.state = {
			show: ''
		}
	}

	onButton = (value) => {
		this.setState({ show: value })
	}

	closeModal = () => {
		this.setState({ show: '' })
	}

	save = () => {
		alert('save')
		this.closeModal()
	}

    render(props, state) {
		return h('div', {id: 'app'},
			//h('span', null, state.show),
			h(Header, { onButton: this.onButton }),
			h(Content, null),
			h(Footer, null)
		)
    }
}

console.log('pre render')

render(h(App),document.body)

console.log('post render')

function checkDb() {

	// id - unique autoincrement identificator of task
	// project_name - project name or caption of the project
	// name - name of taks or caption of task
	// time - keep cumulative time from begining to STOP press
	// start - we need some guide for calculate time increase
	// running - task is in progress now
	// created_at - created at

	db.transaction(function (tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS tasks(ID INTEGER PRIMARY KEY ASC, project_name TEXT, name TEXT, time INTEGER, start DATETIME, running BOOLEAN, created_at DATETIME)', [], null, onError); // table creation
	
	});

	// id - unique autoincrement identificator of task
	// date - 
	// time - 
	// start - we need some guide for calculate time increase
	// running - task is in progress now

	db.transaction(function (tx) {
		tx.executeSql('CREATE TABLE IF NOT EXISTS history(ID INTEGER PRIMARY KEY ASC, time INTEGER, date DATETIME, start DATETIME)', [], null, onError); // table creation
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