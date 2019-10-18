window.onerror = function(err) {
	const container = document.createElement('div');
	container.className = 'NoSupport';
	const p = document.createElement('p');
	p.innerHTML = 'Damn it all to hell!';
	const msg = document.createElement('small');
	msg.innerText = err;
	p.appendChild(msg);
	container.appendChild(p);
	document.body.appendChild(container);
}
import { h, render }  from './lib/preact.js';
import App from './components/App.js';
render(<App />, document.body);
