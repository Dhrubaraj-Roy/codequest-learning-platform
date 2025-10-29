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
        this.editor.addEventListener('scroll', () => this.syncScroll());

        // Initial highlight if there's content
        if (this.editor.textContent.trim()) {
            this.highlight();
        }
    }

    handleInput() {
        if (this.isUpdating) return;
        this.highlight();
        this.updateLineNumbers();
        this.syncScroll();
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
            lineNumbersElement.innerHTML = lines.map((_, i) => {
                const lineNum = i + 1;
                return `<div class="line-num" data-line="${lineNum}">${lineNum}</div>`;
            }).join('');
        }
    }

    syncScroll() {
        const lineNumbersElement = document.getElementById('lineNumbers');
        if (lineNumbersElement) {
            lineNumbersElement.scrollTop = this.editor.scrollTop;
        }
    }

    highlightErrorLine(lineNumber) {
        const lineElements = document.querySelectorAll('.line-num');
        lineElements.forEach(el => el.classList.remove('error-line'));

        if (lineNumber && lineElements[lineNumber - 1]) {
            lineElements[lineNumber - 1].classList.add('error-line');
        }
    }

    clearErrorHighlights() {
        const lineElements = document.querySelectorAll('.line-num');
        lineElements.forEach(el => el.classList.remove('error-line'));
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
let autoRunEnabled = true; // Auto-run enabled by default

document.addEventListener('DOMContentLoaded', () => {
    const editorElement = document.getElementById('codeEditor');
    editor = new CodeEditor(editorElement);

    // Set initial starter code
    const initialCode = `<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <h1>Hello, CodeQuest!</h1>
    <p>Start typing to see real-time preview...</p>
</body>
</html>`;
    editor.setCode(initialCode);

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

    // Auto-Run Toggle
    const autoRunToggle = document.getElementById('autoRunToggle');
    autoRunToggle.addEventListener('change', (e) => {
        autoRunEnabled = e.target.checked;
        if (autoRunEnabled) {
            runCode(); // Run immediately when enabled
            logToConsole('Auto-run enabled', 'info');
        } else {
            logToConsole('Auto-run disabled', 'info');
        }
    });

    // Real-time Preview - Auto-run on code changes
    editorElement.addEventListener('input', debounce(() => {
        if (autoRunEnabled) {
            runCode();
        }
    }, 800)); // 800ms debounce for smooth typing experience

    // Run initial code on page load
    setTimeout(() => {
        runCode();
        logToConsole('Editor ready! Auto-run is enabled.', 'info');
    }, 100);
});

// Syntax Validation Functions
function validateHTML(code) {
    const errors = [];

    // Check for unclosed tags
    const openTags = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    let lineNumber = 1;

    const lines = code.split('\n');

    lines.forEach((line, index) => {
        let lineMatch;
        const lineTagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;

        while ((lineMatch = lineTagRegex.exec(line)) !== null) {
            const fullTag = lineMatch[0];
            const tagName = lineMatch[1].toLowerCase();

            // Skip self-closing tags
            if (fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'meta', 'link'].includes(tagName)) {
                continue;
            }

            if (fullTag.startsWith('</')) {
                // Closing tag
                if (openTags.length === 0 || openTags[openTags.length - 1].name !== tagName) {
                    errors.push({
                        line: index + 1,
                        message: `Unexpected closing tag </${tagName}>`,
                        type: 'error'
                    });
                } else {
                    openTags.pop();
                }
            } else {
                // Opening tag
                openTags.push({ name: tagName, line: index + 1 });
            }
        }
    });

    // Check for unclosed tags
    openTags.forEach(tag => {
        errors.push({
            line: tag.line,
            message: `Unclosed tag <${tag.name}>`,
            type: 'warning'
        });
    });

    return errors;
}

function validateCSS(code) {
    const errors = [];
    let braceCount = 0;

    const lines = code.split('\n');

    lines.forEach((line, index) => {
        // Count braces
        const openBraces = (line.match(/{/g) || []).length;
        const closeBraces = (line.match(/}/g) || []).length;

        braceCount += openBraces - closeBraces;

        // Check for missing semicolons (basic check)
        if (line.includes(':') && !line.includes('{') && !line.trim().endsWith(';') && !line.trim().endsWith('{') && line.trim() !== '' && !line.trim().startsWith('/*') && !line.trim().startsWith('*')) {
            errors.push({
                line: index + 1,
                message: 'Missing semicolon',
                type: 'warning'
            });
        }
    });

    if (braceCount !== 0) {
        errors.push({
            line: lines.length,
            message: braceCount > 0 ? 'Unclosed brace {' : 'Extra closing brace }',
            type: 'error'
        });
    }

    return errors;
}

function validateJavaScript(code) {
    const errors = [];

    try {
        // Try to parse with Function constructor (safer than eval for validation)
        new Function(code);
    } catch (error) {
        const lineMatch = error.message.match(/line (\d+)/);
        const line = lineMatch ? parseInt(lineMatch[1]) : null;

        errors.push({
            line: line,
            message: error.message,
            type: 'error'
        });
    }

    return errors;
}

// Run Code Function
function runCode() {
    if (!editor) {
        console.error('Editor not initialized');
        return;
    }

    const code = editor.getCode();
    const preview = document.getElementById('preview');

    if (!preview) {
        console.error('Preview iframe not found');
        return;
    }

    // Clear previous errors
    editor.clearErrorHighlights();

    console.log('Running code...', 'Language:', editor.language);

    // Validate syntax before running
    let validationErrors = [];
    if (editor.language === 'html') {
        validationErrors = validateHTML(code);
    } else if (editor.language === 'css') {
        validationErrors = validateCSS(code);
    } else if (editor.language === 'javascript') {
        validationErrors = validateJavaScript(code);
    }

    // Display validation errors
    if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
            logToConsole(
                `Line ${error.line || '?'}: ${error.message}`,
                error.type
            );

            if (error.line) {
                editor.highlightErrorLine(error.line);
            }
        });
    }

    try {
        if (editor.language === 'html') {
            // Create a complete HTML document
            const htmlDoc = `<!DOCTYPE html>
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
            console.log('HTML injected into iframe');
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

    // Add timestamp
    const timestamp = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'error':
            icon = '✖';
            break;
        case 'warning':
            icon = '⚠';
            break;
        case 'info':
            icon = '✓';
            break;
        default:
            icon = '•';
    }

    messageElement.innerHTML = `
        <span class="console-time">[${timestamp}]</span>
        <span class="console-icon">${icon}</span>
        <span class="console-text">${escapeHtml(message)}</span>
    `;

    consoleOutput.appendChild(messageElement);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
