import React, { useState } from 'react';
import './getterSetter.css';
import GetterSetterLogo from './getterSetterlogo';

function GetterSetter() {
  const [className, setClassName] = useState('');
  const [inputText, setInputText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inlineCode, setInlineCode] = useState('');
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
    let warningList = [];

    if (lines.length === 0) {
      setWarnings(['⚠️ Please enter at least one variable declaration.']);
      return;
    }

    lines.forEach(line => {
      const trimmedLine = line.trim();
      const standardMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\w+);/);
      const arrayMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\w+)\[(\d+)\];/);
      
      if (!standardMatch && !arrayMatch) {
        warningList.push(`⚠️ Invalid declaration: "${trimmedLine}"`);
        return;
      }

      let dataType, varName,arraySize;
      
      if (arrayMatch) {
        dataType = arrayMatch[1];
        varName = arrayMatch[2];
         arraySize = arrayMatch[3];

         if(arraySize <=0)
         {
             warningList.push(`⚠️ Invalid declaration: "${trimmedLine}"`);
        return;
         }
            const meaningfulName = extractMeaningfulName(varName);
      const capitalized = meaningfulName.charAt(0).toUpperCase() + meaningfulName.slice(1);

      // ✅ Array getter/setter logic restored here
      normalCode += `// For ${varName}\n`;
      normalCode += `${dataType}* mcfn_get${capitalized}() {return ${varName}; }\n`;
      normalCode += `void mcfn_set${capitalized}(${dataType}* pscL_${capitalized}) {strcpy(${varName}, pscL_${capitalized}); }\n\n`;

      if (className.trim() !== '') {
        inlineResult += `// For ${varName}\n`;
        inlineResult += `inline ${dataType}* ${className}::mcfn_get${capitalized}() {return ${varName}; }\n`;
        inlineResult += `inline void ${className}::mcfn_set${capitalized}(${dataType}* pscL_${capitalized}) {strcpy(${varName}, pscL_${capitalized}); }\n\n`;
      }
      return; // skip normal processing
      } else {
        dataType = standardMatch[1];
        varName = standardMatch[2];
      }

      const meaningfulName = extractMeaningfulName(varName);
      const capitalized = meaningfulName.charAt(0).toUpperCase() + meaningfulName.slice(1);

      let paramPrefix = 'siL';
      let useReference = false;
      const prefixMatch = varName.match(/^([^m]*)m/);

      if (prefixMatch && prefixMatch[1]) {
        const prefix = prefixMatch[1];
        switch (prefix) {
          case 'b': paramPrefix = 'bL'; break;
          case 'c': paramPrefix = 'cL'; break;
          case 's':
            if (varName.startsWith('mcS_')) {
              paramPrefix = 'SL';
              useReference = true;
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
          case 'sc': paramPrefix = 'scL'; break;
          default: paramPrefix = 'CL'; useReference = true;
        }
      }

      if (
        varName.startsWith('mcS_') ||
        !['int', 'char', 'bool', 'float', 'double', 'long', 'short', 'void'].some(t => dataType.includes(t))
      ) {
        useReference = true;
        if (varName.startsWith('mcS_')) paramPrefix = 'SL';
      }

      const genBlock = (inline = false) => {
        const inlineText =  inline && className ? `\ninline\n` : '';
        const scope = inline && className ? `${className}::` : '';
        let block = `// For ${varName}\n`;

        if (dataType.includes('bool')) {
          block += `${inlineText}bool ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
          block += `${inlineText}void ${scope}mcfn_set${capitalized}(bool ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        } else if (dataType.includes('string')) {
          block += `${inlineText}string ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
          block += `${inlineText}void ${scope}mcfn_set${capitalized}(string &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        }
         else if (useReference) {
          block += `${inlineText}${dataType} ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
          block += `${inlineText}void ${scope}mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        } else {
          block += `${inlineText}${dataType} ${scope}mcfn_get${capitalized}() {return ${varName}; }\n`;
          block += `${inlineText}void ${scope}mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        }

        return block;
      };

      normalCode += genBlock();
      inlineResult += genBlock(true);
    });

    setWarnings(warningList);
    setGeneratedCode(normalCode);

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
          <label htmlFor="classname">Class Name (optional):</label>
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
        <div className="info-section"> 
            <h3>Supported Data Types:</h3>
             <ul> 
                <li><strong>Primitive types:</strong> int, bool, char, float, double, long double, short, long</li> 
                <li><strong>Standard types:</strong> string</li> <li><strong>Arrays:</strong> char arrays with size</li> 
                <li><strong>Structures:</strong> SResponse mcS_Response; (uses SL_ prefix)</li> 
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
