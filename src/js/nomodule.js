var container = document.createElement('div');
container.className = 'NoSupport';
var p = document.createElement('p');
p.innerHTML = 'Consider using a different browser...';
var msg = document.createElement('small');
msg.innerText = 'Chrome, Firefox, Edge or anything that supports Javascript Modules';
p.appendChild(msg);
container.appendChild(p);
document.body.appendChild(container);