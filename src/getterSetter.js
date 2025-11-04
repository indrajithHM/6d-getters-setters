import React, { useState } from 'react';
import './getterSetter.css';
import GetterSetterLogo from './getterSetterlogo';

function GetterSetter() {
  const [className, setClassName] = useState('');
  const [inputText, setInputText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inlineCode, setInlineCode] = useState('');
  const [initCode, setInitCode] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showInlineWarning, setShowInlineWarning] = useState(false);

  // Extract meaningful name from variable
  const extractMeaningfulName = (varName) => {
    const lastUnderscore = varName.lastIndexOf('_');
    if (lastUnderscore !== -1) return varName.substring(lastUnderscore + 1);
    return varName;
  };

  const generateGettersSetters = () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    let normalCode = '';
    let inlineResult = '';
    let initializationResult = '';
    let warningList = [];

    if (lines.length === 0) {
      setWarnings(['⚠️ Please enter at least one variable declaration.']);
      return;
    }


lines.forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine === '') return;

  const standardMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\*?\s*\w+);/);
  const arrayMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\*?\s*\w+)\[(\d+)\];/);

  if (!standardMatch && !arrayMatch) {
    warningList.push(`⚠️ Invalid declaration: "${trimmedLine}"`);
    return;
  }

  let dataType = '';
  let varName = '';
  let arraySize = '';
  let isPointer = false;

  if (arrayMatch) {
    dataType = (arrayMatch[1] || '').trim();
    varName = (arrayMatch[2] || '').trim();
    arraySize = (arrayMatch[3] || '').trim();

    if (!arraySize || isNaN(Number(arraySize)) || Number(arraySize) <= 0) {
      warningList.push(`⚠️ Invalid array size in "${trimmedLine}"`);
      return;
    }
  } else if (standardMatch) {
    dataType = (standardMatch[1] || '').trim();
    varName = (standardMatch[2] || '').trim();
  }

  if (dataType.includes('*') || varName.startsWith('*')) {
    isPointer = true;
    dataType = dataType.replace('*', '').trim();
    varName = varName.replace('*', '').trim();
  }

  if (!dataType || !varName) {
    warningList.push(`⚠️ Could not parse declaration: "${trimmedLine}"`);
    return;
  }

  const meaningfulName = extractMeaningfulName(varName);
  const capitalized = meaningfulName.charAt(0).toUpperCase() + meaningfulName.slice(1);

  // === prefix logic ===
  let paramPrefix = 'siL';
  //let useReference = false;
  const prefixMatch = varName.match(/.*m[a-zA-Z](ull|ul|ld|ui|us|uc|sc|s|i|l|f|d|b|c|C)_/);

  if (prefixMatch && prefixMatch[1]) {
    const prefix = prefixMatch[1];
    switch (prefix) {
      case 'b': paramPrefix = 'bL'; break;
      case 'c': paramPrefix = 'cL'; break;
      case 'sc': paramPrefix = 'scL'; break;
      case 's':
        if (varName.startsWith('mcS_')) {
          paramPrefix = 'SL';
         // useReference = true;
        } else paramPrefix = 'siL';
        break;
      case 'i': paramPrefix = 'iL'; break;
      case 'l': paramPrefix = 'slL'; break;
      case 'f': paramPrefix = 'fL'; break;
      case 'd': paramPrefix = 'dL'; break;
      case 'ld': paramPrefix = 'ldL'; break;
      case 'ull': paramPrefix = 'ullL'; break;
      case 'ul': paramPrefix = 'ulL'; break;
      case 'ui': paramPrefix = 'uiL'; break;
      case 'us': paramPrefix = 'usL'; break;
      case 'uc': paramPrefix = 'ucL'; break;
      case 'C' : paramPrefix = 'CL';break;
      default: paramPrefix = 'CL';// useReference = true;
    }
  }

  if (
    varName.startsWith('mcS_') ||
    !['int', 'char', 'bool', 'float', 'double', 'long', 'short', 'void', 'string'].some(t => dataType.includes(t))
  ) {
    //useReference = true;
    if (varName.startsWith('mcS_')) paramPrefix = 'SL';
  }

  // 🔹 Add pointer prefix rule
  if (isPointer) {
    paramPrefix = 'p' + paramPrefix; // prepend 'p'
  }

  // === POINTER HANDLING ===
  if (isPointer) {
    normalCode += `// For ${varName}\n`;
    normalCode += `${dataType}* mcfn_get${capitalized}() {return ${varName}; }\n`;
    normalCode += `void mcfn_set${capitalized}(${dataType}* ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
    initializationResult += `${varName} = nullptr;\n`;

    if (className.trim() !== '') {
      inlineResult += `// For ${varName}\n`;
      inlineResult += `inline\n ${dataType}* ${className}::mcfn_get${capitalized}() {return ${varName}; }\n`;
      inlineResult += `inline\n void ${className}::mcfn_set${capitalized}(${dataType}* ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
    }
    return;
  }

  // === ARRAY HANDLING ===
  if (arrayMatch) {
    if (dataType.includes('char')) {
      normalCode += `// For ${varName}\n`;
      normalCode += `${dataType}* mcfn_get${capitalized}() {return ${varName}; }\n`;
      normalCode += `void mcfn_set${capitalized}(${dataType}* pscL_${capitalized}) {strcpy(${varName}, pscL_${capitalized}); }\n\n`;
      initializationResult += `memset(${varName}, 0x00, sizeof(${varName}));\n`;

      if (className.trim() !== '') {
        inlineResult += `// For ${varName}\n`;
        inlineResult += `inline\n ${dataType}* ${className}::mcfn_get${capitalized}() {return ${varName}; }\n`;
        inlineResult += `inline\n void ${className}::mcfn_set${capitalized}(${dataType}* pscL_${capitalized}) {strcpy(${varName}, pscL_${capitalized}); }\n\n`;
      }
      return;
    } else {
      warningList.push(`⚠️ Unsupported array type: "${trimmedLine}"`);
      return;
    }
  }
// === NORMAL VARIABLE HANDLING ===
const genBlock = (inline = false) => {
  const inlineText = inline && className ? `inline\n` : '';
  const scope = inline && className ? `${className}::` : '';
  let block = `// For ${varName}\n`;

  if (dataType.includes('bool')) {
    block += `${inlineText}bool ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
    block += `${inlineText}void ${scope}mcfn_set${capitalized}(bool ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
  } else if (dataType.includes('char')) {
    block += `${inlineText}char ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
    block += `${inlineText}void ${scope}mcfn_set${capitalized}(char ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
  } else if (dataType.includes('string')) {
    block += `${inlineText}string ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
    block += `${inlineText}void ${scope}mcfn_set${capitalized}(string &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
  } else if (
    dataType.includes('int') ||
    dataType.includes('short') ||
    dataType.includes('long') ||
    dataType.includes('double') ||
    dataType.includes('float')
  ) {
    block += `${inlineText}${dataType} ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
    block += `${inlineText}void ${scope}mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
  } else {
    block += `${inlineText}${dataType} ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
    block += `${inlineText}void ${scope}mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
  }

  return block;
};

// ✅ Generate only once
const generatedBlock = genBlock();
const inlineBlock = genBlock(true);
normalCode += generatedBlock;
inlineResult += inlineBlock;

// ✅ Add initialization ONCE per variable
if (isPointer) initializationResult += `${varName} = nullptr;\n`;
else if (dataType.includes('bool')) initializationResult += `${varName} = false;\n`;
else if (dataType.includes('char')) initializationResult += `${varName} = '\\0';\n`;
else if (dataType.includes('string')) initializationResult += `${varName} = "";\n`;
else if (
  dataType.includes('int') ||
  dataType.includes('short') ||
  dataType.includes('long') ||
  dataType.includes('double') ||
  dataType.includes('float')
) initializationResult += `${varName} = 0;\n`;
else initializationResult += `${varName} = {};\n`;
});



    setWarnings(warningList);
    setGeneratedCode(normalCode);
     setInitCode(initializationResult);

    if (className.trim() === '') {
      setShowInlineWarning(true);
      setInlineCode('');
    } else {
      setShowInlineWarning(false);
      setInlineCode(inlineResult);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const clearAll = () => {
    setInputText('');
    setClassName('');
    setGeneratedCode('');
    setInlineCode('');
    setInitCode('');
    setWarnings([]);
    setShowInlineWarning(false);
    setCopied(false);
  };

  return (
    <div className="App">
      <div className="container">
        <div className="app-header">
          <GetterSetterLogo size={80} />
          <h1>C++ Getter/Setter Generator</h1>
        </div>

        {/* Class Name Input */}
        <div className="input-section">
          <label htmlFor="classname">Class Name (optional) for Inline : </label>
          <input
            id="classname"
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Enter class name (optional) : e.g CHello"
          />
        </div>

        {/* Variable Input */}
        <div className="input-section">
          <label htmlFor="variables">Enter your C++ variables:</label>
            {/* Warnings */}
        
          <textarea
            id="variables"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g. int mcsi_Value;"
            rows={10}
          />
          {warnings.length > 0 && (
          <div className="warning-section">
            <ul>
              {warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
        </div>

        <div className="buttons">
          <button onClick={generateGettersSetters} className="generate-btn">
            Generate Getters/Setters
          </button>
          <button onClick={clearAll} className="clear-btn">
            Clear All
          </button>
        </div>

        

        {/* Normal Getters/Setters */}
        {generatedCode && (
          <div className="output-section">
            <div className="output-header">
              <h2>Generated Getters/Setters</h2>
              <button
                onClick={() => copyToClipboard(generatedCode)}
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          
            <pre className="code-block">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}

        {/* Inline Section */}
        {inlineCode && (
        <div className="output-section">
          <div className="output-header">
            <h2>Inline (with ClassName::)</h2>
            {inlineCode && (
              <button
                onClick={() => copyToClipboard(inlineCode)}
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            )}
          </div>
          {showInlineWarning ? (
            <div className="inline-warning">
              ⚠️ No class name provided — Inline version skipped.
            </div>
          ) : (
            inlineCode && (
              <pre className="code-block">
                <code>{inlineCode}</code>
              </pre>
            )
          )}
        </div>)}
        {/* Initialization Code Section */}
{initCode && (
  <div className="output-section">
    <div className="output-header">
      <h2>Initialization Code</h2>
      <button
        onClick={() => copyToClipboard(initCode)}
        className={`copy-btn ${copied ? 'copied' : ''}`}
      >
        {copied ? '✓ Copied!' : 'Copy'}
      </button>
    </div>
    <pre className="code-block">
      <code>{initCode}</code>
    </pre>
  </div>
)}

        <div className="info-section"> 
            <h3>Supported Data Types:</h3>
             <ul> 
                <li><strong>Primitive types:</strong> int, bool, char, float, double, long double, short, long</li> 
                <li><strong>Standard types:</strong> string</li> <li><strong>Arrays:</strong> char arrays with size</li> 
                <li><strong>Structures:</strong> SResponse mcS_Response; (uses SL_ prefix)</li> 
                <li><strong>Pointers:</strong> Any Kind of Pointers e.g CHello *pmeC_Hello</li> 
                <li><strong>Custom types:</strong> Any user-defined class/struct</li> 
                </ul> 
                <h3>Naming Convention:</h3> 
                <p>The generator extracts names after the last underscore:</p> 
                <ul> 
                    <li>
                        <code>int mcsi_Magi;</code> → <code>mcfn_getMagi()</code> / <code>mcfn_setMagi(int siL_Magi)</code>
                        </li>
                         </ul>
        </div>
      </div>
    </div>
  );
}

export default GetterSetter;
