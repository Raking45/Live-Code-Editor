function run() {
  const htmlCode = document.getElementById("html-code").value;
  const cssCode = document.getElementById("css-code").value;
  const jsCode = document.getElementById("js-code").value;

  const output = document.getElementById("output").contentDocument;
  output.open();
  output.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          background: #fff;
          color: #333;
        }
        ${cssCode}
      </style>
    </head>
    <body>${htmlCode}</body>
    </html>
  `);
  output.close();

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.appendChild(output.createTextNode(jsCode));
  output.body.appendChild(script);

  updateDOMTree();
}

function generateCSS() {
  const html = document.getElementById("html-code").value;
  const css = document.getElementById("css-code").value;

  const tagMatches = [...html.matchAll(/<(\w+)/g)].map(m => m[1]);
  const classMatches = [...html.matchAll(/class=["']([^"']+)["']/g)]
    .flatMap(m => m[1].split(/\s+/));
  const idMatches = [...html.matchAll(/id=["']([^"']+)["']/g)].map(m => m[1]);

  const tags = [...new Set(tagMatches)];
  const classes = [...new Set(classMatches)];
  const ids = [...new Set(idMatches)];

  let generated = '';

  tags.forEach(tag => {
    if (!css.includes(`${tag} {`)) {
      generated += `${tag} {\n  \n}\n\n`;
    }
  });

  classes.forEach(cls => {
    if (!css.includes(`.${cls} {`)) {
      generated += `.${cls} {\n  \n}\n\n`;
    }
  });

  ids.forEach(id => {
    if (!css.includes(`#${id} {`)) {
      generated += `#${id} {\n  \n}\n\n`;
    }
  });

  document.getElementById("css-code").value += '\n' + generated;
}

function updateDOMTree() {
  const html = document.getElementById("html-code").value;
  const container = document.getElementById("dom-tree");
  const interactionsEnabled = document.getElementById("dom-interact").checked;

  container.innerHTML = '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  function createSelector(el) {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? `#${el.id}` : '';
    const classes = el.classList.length ? '.' + [...el.classList].join('.') : '';
    return `${tag}${id}${classes}`;
  }

  function createTree(el, indent = 0) {
    if (el.nodeType !== 1) return;

    const selector = createSelector(el);
    const entry = document.createElement('div');
    entry.className = 'dom-node';
    entry.style.paddingLeft = `${indent * 1.2}rem`;
    entry.textContent = `<${selector}>`;

    if (interactionsEnabled) {
      entry.title = `Click to copy\nShift+Click to insert in JS`;

      entry.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.shiftKey) {
          const jsEditor = document.getElementById("js-code");
          const insert = `document.querySelector("${selector}")`;
          const start = jsEditor.selectionStart;
          const end = jsEditor.selectionEnd;
          const before = jsEditor.value.substring(0, start);
          const after = jsEditor.value.substring(end);
          jsEditor.value = before + insert + after;
          jsEditor.focus();
          jsEditor.selectionStart = jsEditor.selectionEnd = start + insert.length;
        } else {
          navigator.clipboard.writeText(selector).then(() => {
            entry.classList.add('copied');
            setTimeout(() => entry.classList.remove('copied'), 1000);
          });
        }
      });
    }

    container.appendChild(entry);
    [...el.children].forEach(child => createTree(child, indent + 1));
  }

  [...body.children].forEach(child => createTree(child));
}

// Re-run DOM tree if toggle changes
document.getElementById("dom-interact").addEventListener("change", updateDOMTree);

// Initial run
run();
