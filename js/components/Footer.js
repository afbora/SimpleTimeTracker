import { h, render, Component } from '../preact/preact.js'

export default class Footer extends Component {
    constructor(props) {
        super(props);
    }

    render(props, state) {
        return h('div', { class: 'footer' },
            h('div', { class: 'footer' }, 'Dev by Andrey Krivtsov, ver 1.0')
        )
    }
}