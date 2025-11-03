import React, { useState } from 'react';
import './getterSetter.css';
import GetterSetterLogo from './getterSetterlogo';

function GetterSetter() {
  const [inputText, setInputText] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Function to extract meaningful name from variable name
  const extractMeaningfulName = (varName) => {
    // Find the last underscore and extract everything after it
    const lastUnderscore = varName.lastIndexOf('_');
    if (lastUnderscore !== -1) {
      return varName.substring(lastUnderscore + 1);
    }
    
    // If no underscore, return the original name
    return varName;
  };

  const generateGettersSetters = () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    let code = '';

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Match variable declarations with various patterns
      const standardMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\w+);/);
      const arrayMatch = trimmedLine.match(/(\w+(?:\s+\w+)*)\s+(\w+)\[(\d+)\];/);

      if (arrayMatch) {
        const dataType = arrayMatch[1];
        const varName = arrayMatch[2];
       // const arraySize = arrayMatch[3];
        const meaningfulName = extractMeaningfulName(varName);
        const capitalized = meaningfulName.charAt(0).toUpperCase() + meaningfulName.slice(1);
        
        code += `// For ${varName}\n`;
        code += `${dataType}* mcfn_get${capitalized}() {return ${varName}; }\n`;
        code += `void mcfn_set${capitalized}(${dataType}* pscL_${capitalized}) {strcpy(${varName}, pscL_${capitalized}); }\n\n`;
      }
      else if (standardMatch) {
        const dataType = standardMatch[1];
        const varName = standardMatch[2];
        const meaningfulName = extractMeaningfulName(varName);
        const capitalized = meaningfulName.charAt(0).toUpperCase() + meaningfulName.slice(1);
        
        // Extract prefix before 'm' to determine data type and parameter prefix
        const prefixMatch = varName.match(/^([^m]*)m/);
        let paramPrefix = 'siL';
        let useReference = false;
        
        if (prefixMatch && prefixMatch[1]) {
          const prefix = prefixMatch[1];
          switch(prefix) {
            case 'b': paramPrefix = 'bL'; break; // bool
            case 'c': paramPrefix = 'cL'; break; // char
            case 's': 
              // Check if it's structure (mcS_) or short int (mcsi_)
              if (varName.startsWith('mcS_')) {
                paramPrefix = 'SL';
                useReference = true;
              } else {
                paramPrefix = 'siL';
              }
              break;
            case 'i': paramPrefix = 'iL'; break; // int
            case 'l': paramPrefix = 'slL'; break; // long
            case 'f': paramPrefix = 'fL'; break; // float
            case 'd': paramPrefix = 'dL'; break; // double
            case 'ld': paramPrefix = 'ldL'; break; // long double
            case 'ull': paramPrefix = 'ullL'; break; // unsigned long long
            case 'ul': paramPrefix = 'ulL'; break; // unsigned long
            case 'ui': paramPrefix = 'uiL'; break; // unsigned int
            case 'us': paramPrefix = 'usL'; break; // unsigned short
            case 'uc': paramPrefix = 'ucL'; break; // unsigned char
            case 'sc': paramPrefix = 'scL'; break; // signed char
            default: 
              paramPrefix = 'CL'; 
              useReference = true;
          }
        } else {
          // Default based on data type
          if (dataType.includes('string')) {
            paramPrefix = 'CL';
            useReference = true;
          }
          else if (dataType.includes('bool')) paramPrefix = 'bL';
          else if (dataType.includes('double')) paramPrefix = 'dL';
          else if (dataType.includes('float')) paramPrefix = 'fL';
          else if (dataType.includes('long')) paramPrefix = 'slL';
          else if (dataType.includes('char')) paramPrefix = 'cL';
          else paramPrefix = 'siL';
        }
        
        // Force reference for structures and custom types
        if (varName.startsWith('mcS_') || !['int', 'char', 'bool', 'float', 'double', 'long', 'short', 'void'].some(type => dataType.includes(type))) {
          useReference = true;
          if (varName.startsWith('mcS_')) {
            paramPrefix = 'SL';
          }
        }
        
        code += `// For ${varName}\n`;
        
        // Special handling for bool type
        if (dataType.includes('bool')) {
          code += `bool mcfn_get${capitalized}() {return ${varName}; }\n`;
          code += `void mcfn_set${capitalized}(bool ${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        }
        // Special handling for long double
        else if (dataType.includes('long double')) {
          code += `long double mcfn_get${capitalized}() {return ${varName}; }\n`;
          code += `void mcfn_set${capitalized}(long double &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        }
        // For string type
        else if (dataType.includes('string')) {
          code += `string mcfn_get${capitalized}() {return ${varName};}\n`;
          code += `void mcfn_set${capitalized}(string &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized};}\n\n`;
        }
        // For structures and custom data types (with reference)
        else if (useReference) {
          code += `${dataType} mcfn_get${capitalized}() {return ${varName}; }\n`;
          code += `void mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized};}\n\n`;
        }
        // For primitive types
        else {
          code += `${dataType} mcfn_get${capitalized}() {return ${varName}; }\n`;
          code += `void mcfn_set${capitalized}(${dataType} &${paramPrefix}_${capitalized}) {${varName} = ${paramPrefix}_${capitalized}; }\n\n`;
        }
      }
    });

    setGeneratedCode(code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const clearAll = () => {
    setInputText('');
    setGeneratedCode('');
    setCopied(false);
  };

  return (
    <div className="App">
      <div className="container">
        <div className="app-header">
          <GetterSetterLogo size={80} />
          <h1>C++ Getter/Setter Generator</h1>
        </div>
        
        <div className="input-section">
          <label htmlFor="variables">Enter your C++ variables:</label>
          <textarea
            id="variables"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter variables Name:
"
            rows={12}
          />
        </div>

        <div className="buttons">
          <button onClick={generateGettersSetters} className="generate-btn">
            Generate Getters/Setters
          </button>
          <button onClick={clearAll} className="clear-btn">
            Clear All
          </button>
        </div>

        {generatedCode && (
          <div className="output-section">
            <div className="output-header">
              <h2>Generated Code:</h2>
              <button 
                onClick={copyToClipboard} 
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
              </button>
            </div>
            <pre className="code-block">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}

        <div className="info-section">
          <h3>Supported Data Types:</h3>
          <ul>
            <li><strong>Primitive types:</strong> int, bool, char, float, double, long double, short, long</li>
            <li><strong>Standard types:</strong> string</li>
            <li><strong>Arrays:</strong> char arrays with size</li>
            <li><strong>Structures:</strong> SResponse mcS_Response; (uses SL_ prefix)</li>
            <li><strong>Custom types:</strong> Any user-defined class/struct</li>
          </ul>
          <h3>Naming Convention:</h3>
          <p>The generator extracts names after the last underscore:</p>
          <ul>
            <li><code>mcsi_Magi</code> → <code>mcfn_getMagi()</code> / <code>mcfn_setMagi(int siL_Magi)</code></li>

          </ul>
        </div>
      </div>
    </div>
  );
}

export default GetterSetter;