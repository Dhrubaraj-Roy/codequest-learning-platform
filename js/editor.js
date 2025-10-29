// CodeQuest Editor - Syntax Highlighting Engine with ContentEditable

class CodeEditor {
    constructor(editorElement) {
        this.editor = editorElement;
        this.language = this.editor.getAttribute('data-language') || 'html';
        this.isUpdating = false;
        this.init();
    }

    init() {
        // Event listeners
        this.editor.addEventListener('input', () => this.handleInput());
        this.editor.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.editor.addEventListener('paste', (e) => this.handlePaste(e));

        // Initial highlight if there's content
        if (this.editor.textContent.trim()) {
            this.highlight();
        }
    }

    handleInput() {
        if (this.isUpdating) return;
        this.highlight();
        this.updateLineNumbers();
    }

    handleKeyDown(e) {
        // Handle Tab key
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '    '); // 4 spaces
        }

        // Prevent formatting shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (['b', 'i', 'u'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        }
    }

    handlePaste(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    }

    highlight() {
        this.isUpdating = true;

        // Save cursor position
        const position = this.saveCursorPosition();

        // Get plain text
        const code = this.getPlainText();

        // Highlight based on language
        let highlightedCode;
        switch (this.language) {
            case 'html':
                highlightedCode = this.highlightHTML(code);
                break;
            case 'css':
                highlightedCode = this.highlightCSS(code);
                break;
            case 'javascript':
                highlightedCode = this.highlightJavaScript(code);
                break;
            default:
                highlightedCode = this.escapeHTML(code);
        }

        // Update editor content
        this.editor.innerHTML = highlightedCode;

        // Restore cursor position
        this.restoreCursorPosition(position);

        this.isUpdating = false;
    }

    getPlainText() {
        // Extract plain text from contenteditable
        return this.editor.textContent || '';
    }

    escapeHTML(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // HTML Syntax Highlighter
    highlightHTML(code) {
        // Escape HTML first
        code = this.escapeHTML(code);

        // Highlight HTML comments
        code = code.replace(
            /(&lt;!--[\s\S]*?--&gt;)/g,
            '<span class="token-comment">$1</span>'
        );

        // Highlight HTML tags with attributes
        code = code.replace(
            /(&lt;\/?)([\w-]+)([\s\S]*?)(&gt;)/g,
            (match, openBracket, tagName, attributes, closeBracket) => {
                // Highlight tag name
                let result = openBracket + `<span class="token-tag">${tagName}</span>`;

                // Highlight attributes
                if (attributes) {
                    attributes = attributes.replace(
                        /([\w-]+)(=)(&quot;|&#039;)(.*?)(&quot;|&#039;)/g,
                        '<span class="token-attribute">$1</span>$2<span class="token-string">$3$4$5</span>'
                    );
                    result += attributes;
                }

                result += closeBracket;
                return result;
            }
        );

        return code;
    }

    // CSS Syntax Highlighter
    highlightCSS(code) {
        code = this.escapeHTML(code);

        // Highlight CSS comments
        code = code.replace(
            /(\/\*[\s\S]*?\*\/)/g,
            '<span class="token-comment">$1</span>'
        );

        // Highlight selectors
        code = code.replace(
            /([.#]?[\w-]+)(\s*{)/g,
            '<span class="token-tag">$1</span>$2'
        );

        // Highlight properties
        code = code.replace(
            /([\w-]+)(\s*:)/g,
            '<span class="token-property">$1</span>$2'
        );

        // Highlight values (strings, colors, numbers)
        code = code.replace(
            /(:\s*)(.*?)(;)/g,
            (match, colon, value, semicolon) => {
                value = value.replace(
                    /(#[\da-fA-F]{3,6}|rgba?\([^)]+\)|hsla?\([^)]+\))/g,
                    '<span class="token-string">$1</span>'
                );
                value = value.replace(
                    /(\d+[\w%]*)/g,
                    '<span class="token-number">$1</span>'
                );
                value = value.replace(
                    /(&quot;.*?&quot;|&#039;.*?&#039;)/g,
                    '<span class="token-string">$1</span>'
                );
                return colon + '<span class="token-value">' + value + '</span>' + semicolon;
            }
        );

        return code;
    }

    // JavaScript Syntax Highlighter
    highlightJavaScript(code) {
        code = this.escapeHTML(code);

        // Highlight single-line comments
        code = code.replace(
            /(\/\/.*?$)/gm,
            '<span class="token-comment">$1</span>'
        );

        // Highlight multi-line comments
        code = code.replace(
            /(\/\*[\s\S]*?\*\/)/g,
            '<span class="token-comment">$1</span>'
        );

        // Highlight strings
        code = code.replace(
            /(&quot;.*?&quot;|&#039;.*?&#039;|`.*?`)/g,
            '<span class="token-string">$1</span>'
        );

        // Highlight keywords
        const keywords = [
            'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
            'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally',
            'throw', 'new', 'class', 'extends', 'import', 'export', 'default',
            'async', 'await', 'typeof', 'instanceof', 'this', 'super'
        ];

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            code = code.replace(regex, '<span class="token-keyword">$1</span>');
        });

        // Highlight numbers
        code = code.replace(
            /\b(\d+\.?\d*)\b/g,
            '<span class="token-number">$1</span>'
        );

        // Highlight function names
        code = code.replace(
            /\b([\w]+)(\s*\()/g,
            '<span class="token-function">$1</span>$2'
        );

        // Highlight operators
        code = code.replace(
            /([+\-*/%=&lt;&gt;!&|^~?:])/g,
            '<span class="token-operator">$1</span>'
        );

        return code;
    }

    // Cursor Position Management
    saveCursorPosition() {
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return null;

        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.editor);
        preCaretRange.setEnd(range.endContainer, range.endOffset);

        return preCaretRange.toString().length;
    }

    restoreCursorPosition(position) {
        if (position === null) return;

        const selection = window.getSelection();
        const range = document.createRange();

        try {
            let currentPos = 0;
            const walker = document.createTreeWalker(
                this.editor,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let node;
            let found = false;

            while (node = walker.nextNode()) {
                const nodeLength = node.textContent.length;
                if (currentPos + nodeLength >= position) {
                    range.setStart(node, position - currentPos);
                    range.collapse(true);
                    found = true;
                    break;
                }
                currentPos += nodeLength;
            }

            if (!found && this.editor.lastChild) {
                const lastNode = this.getLastTextNode(this.editor);
                if (lastNode) {
                    range.setStart(lastNode, lastNode.textContent.length);
                    range.collapse(true);
                }
            }

            selection.removeAllRanges();
            selection.addRange(range);
        } catch (e) {
            console.error('Error restoring cursor:', e);
        }
    }

    getLastTextNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return node;

        for (let i = node.childNodes.length - 1; i >= 0; i--) {
            const textNode = this.getLastTextNode(node.childNodes[i]);
            if (textNode) return textNode;
        }

        return null;
    }

    updateLineNumbers() {
        const lines = this.getPlainText().split('\n');
        const lineNumbersElement = document.getElementById('lineNumbers');
        if (lineNumbersElement) {
            lineNumbersElement.textContent = lines.map((_, i) => i + 1).join('\n');
        }
    }

    setLanguage(language) {
        this.language = language;
        this.editor.setAttribute('data-language', language);
        this.highlight();
    }

    getCode() {
        return this.getPlainText();
    }

    setCode(code) {
        this.editor.textContent = code;
        this.highlight();
        this.updateLineNumbers();
    }

    clear() {
        this.editor.textContent = '';
        this.updateLineNumbers();
    }
}

// Initialize Editor
let editor;

document.addEventListener('DOMContentLoaded', () => {
    const editorElement = document.getElementById('codeEditor');
    editor = new CodeEditor(editorElement);

    // Language Selector
    const languageSelector = document.getElementById('languageSelector');
    const languageBadge = document.getElementById('languageBadge');

    languageSelector.addEventListener('change', (e) => {
        const language = e.target.value;
        editor.setLanguage(language);
        languageBadge.textContent = language.toUpperCase();

        // Set default starter code
        switch (language) {
            case 'html':
                editor.setCode('<!-- Write your HTML code here -->\n<h1>Hello World</h1>');
                break;
            case 'css':
                editor.setCode('/* Write your CSS code here */\nbody {\n    background-color: #f0f0f0;\n}');
                break;
            case 'javascript':
                editor.setCode('// Write your JavaScript code here\nconsole.log("Hello World");');
                break;
        }
    });

    // Run Button
    const runBtn = document.getElementById('runBtn');
    runBtn.addEventListener('click', () => {
        runCode();
    });

    // Format Button
    const formatBtn = document.getElementById('formatBtn');
    formatBtn.addEventListener('click', () => {
        formatCode();
    });

    // Reset Button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset the editor?')) {
            editor.clear();
            clearPreview();
            clearConsole();
        }
    });

    // Clear Preview Button
    const clearPreviewBtn = document.getElementById('clearPreviewBtn');
    clearPreviewBtn.addEventListener('click', () => {
        clearPreview();
    });

    // Clear Console Button
    const clearConsoleBtn = document.getElementById('clearConsoleBtn');
    clearConsoleBtn.addEventListener('click', () => {
        clearConsole();
    });

    // Auto-run on HTML changes (optional - uncomment if desired)
    // editorElement.addEventListener('input', debounce(() => {
    //     if (editor.language === 'html') {
    //         runCode();
    //     }
    // }, 1000));
});

// Run Code Function
function runCode() {
    const code = editor.getCode();
    const preview = document.getElementById('preview');
    const consoleOutput = document.getElementById('console');

    try {
        if (editor.language === 'html') {
            // Create a complete HTML document
            const htmlDoc = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { margin: 10px; font-family: Arial, sans-serif; }
                    </style>
                </head>
                <body>
                    ${code}
                    <script>
                        // Capture console logs
                        (function() {
                            const originalLog = console.log;
                            const originalError = console.error;
                            const originalWarn = console.warn;

                            console.log = function(...args) {
                                window.parent.postMessage({ type: 'log', message: args.join(' ') }, '*');
                                originalLog.apply(console, args);
                            };

                            console.error = function(...args) {
                                window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*');
                                originalError.apply(console, args);
                            };

                            console.warn = function(...args) {
                                window.parent.postMessage({ type: 'warn', message: args.join(' ') }, '*');
                                originalWarn.apply(console, args);
                            };

                            // Capture runtime errors
                            window.addEventListener('error', function(e) {
                                window.parent.postMessage({
                                    type: 'error',
                                    message: e.message + ' (Line: ' + e.lineno + ')'
                                }, '*');
                            });
                        })();
                    <\/script>
                </body>
                </html>
            `;

            preview.srcdoc = htmlDoc;
            logToConsole('Code executed successfully', 'info');
        } else if (editor.language === 'javascript') {
            clearPreview();
            try {
                // Execute JavaScript code
                const result = eval(code);
                if (result !== undefined) {
                    logToConsole(`Result: ${result}`, 'info');
                }
            } catch (error) {
                logToConsole(`Error: ${error.message}`, 'error');
            }
        } else if (editor.language === 'css') {
            // For CSS, create a simple HTML with the CSS applied
            const htmlWithCSS = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        ${code}
                    </style>
                </head>
                <body>
                    <h1>CSS Preview</h1>
                    <p>Your CSS has been applied to this page.</p>
                    <button>Sample Button</button>
                    <div class="box">Sample Box</div>
                </body>
                </html>
            `;
            preview.srcdoc = htmlWithCSS;
            logToConsole('CSS applied successfully', 'info');
        }
    } catch (error) {
        logToConsole(`Error: ${error.message}`, 'error');
    }
}

// Console logging
window.addEventListener('message', (event) => {
    if (event.data.type) {
        logToConsole(event.data.message, event.data.type);
    }
});

function logToConsole(message, type = 'log') {
    const consoleOutput = document.getElementById('console');
    const messageElement = document.createElement('div');
    messageElement.className = `console-message console-${type}`;
    messageElement.textContent = `[${type.toUpperCase()}] ${message}`;
    consoleOutput.appendChild(messageElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
    const consoleOutput = document.getElementById('console');
    consoleOutput.innerHTML = '';
}

function clearPreview() {
    const preview = document.getElementById('preview');
    preview.srcdoc = '';
}

// Format Code (basic indentation)
function formatCode() {
    const code = editor.getCode();
    let formatted = code;

    if (editor.language === 'html') {
        formatted = formatHTML(code);
    } else if (editor.language === 'css') {
        formatted = formatCSS(code);
    } else if (editor.language === 'javascript') {
        formatted = formatJS(code);
    }

    editor.setCode(formatted);
    logToConsole('Code formatted', 'info');
}

function formatHTML(html) {
    // Basic HTML formatting
    let formatted = '';
    let indent = 0;
    const tab = '    ';

    html.split(/>\s*</).forEach((element) => {
        if (element.match(/^\/\w/)) {
            indent--;
        }

        formatted += tab.repeat(indent) + '<' + element + '>\n';

        if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input")) {
            indent++;
        }
    });

    return formatted.substring(1, formatted.length - 2);
}

function formatCSS(css) {
    // Basic CSS formatting
    return css
        .replace(/\s*{\s*/g, ' {\n    ')
        .replace(/;\s*/g, ';\n    ')
        .replace(/\s*}\s*/g, '\n}\n\n');
}

function formatJS(js) {
    // Basic JS formatting (very simple)
    return js
        .replace(/;\s*/g, ';\n')
        .replace(/{\s*/g, ' {\n    ')
        .replace(/}\s*/g, '\n}\n');
}

// Utility: Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
