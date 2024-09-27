import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Moon, Sun } from 'lucide-react';
import { Switch } from '@headlessui/react';

import './App.css';
import LoF from "laws-of-form-react"

const verify = (str) => {
  let count = 0;
  for (let char of str) {
    if (char === '(') count++;
    if (char === ')') count--;
    if (count < 0) return false;
  }
  return count === 0;
};

const evaluate = (str, steps = [], bfMode) => {
  if (bfMode) return evaluateBF(str, steps);
  steps.push(`Start: ${str}`);
  let prev = '';
  while (str !== prev) {
    prev = str;
    str = str.replace(/\(\(\)\)/g, '');
    str = str.replace(/\(\)\(\)/g, '()');
    if (str !== prev) {
      steps.push(`Simplify: ${str}`);
    }
  }
  steps.push(`Final: ${str}`);
  return { result: str, steps };
};

const evaluateBF = (str, steps = []) => {
	const simplifyBF = (s) => {
		// Remove all whitespace from the input string
		s = s.replace(/\s+/g, '');

		const rules = {
			'\(\)1\(\)3': '()2', '\(\)3\(\)1': '()2', '\(\)1\(\)1': '()1', '\(\)3\\()3': '()3',
			'\(\)3\(\)0': '()3', '\(\)1\(\)0': '()1', '\(\)1\(\)2': '()2', '\(\)2\(\)1': '()2',
			'\(\)2\(\)2': '()2', '\(\)3\(\)2': '()2', '\(\)2\(\)3': '()2', '\(\)0\(\)0': '()0', 
      '\(\)2\(\)0': '()2', '\(\)0\(\)1': '()1', '\(\)0\(\)2': '()2', '\(\)3\(\)3': '()3', 
      '\(\)0\(\)3': '()3',
		};

		// Enrich with twos
		const enrichWithTwos = (input) => {
			let result = input;
			let stack = [];
			let insertions = [];

			for (let i = 0; i < result.length; i++) {
				if (result[i] === '(') {
					stack.push(i);
				} else if (result[i] === ')') {
					let openIndex = stack.pop();
					// Check if this pair doesn't already have a number after it
					if (i === result.length - 1 || isNaN(parseInt(result[i + 1]))) {
						insertions.push(i + 1);
					}
				}
			}

			// Insert '2's from right to left
			for (let i = insertions.length - 1; i >= 0; i--) {
				result = result.slice(0, insertions[i]) + '2' + result.slice(insertions[i]);
			}

			return result;
		};

		s = enrichWithTwos(s);
		console.log("After enrichment:", s);
	  
		let prev = '';
		while (s !== prev) {
			prev = s;
			for (const [pattern, replacement] of Object.entries(rules)) {
				const r = `${s}`;
				s = s.replace(pattern, replacement);

				if (s !== r)
					console.log(s);
			}
			// Handle ( ()a)b = ()(a+b mod 4)
			let r = `${s}`;
			s = s.replace(/\(\(\)(\d)\)(\d)/g, (_, a, b) => `()${(parseInt(a) + parseInt(b)) % 4}`);
			if (s !== r)
				console.log(s);
		}
		return s;
	};
  
	let result = str;
	let prev = '';
	while (result !== prev) {
	  prev = result;
	  result = simplifyBF(result);
	  if (result !== prev) steps.push(result);
	}
	return { result, steps };
};

const measure = (str) => {
  return evaluate(str).result;
};

const generateCombinations = (variables, bfMode) => {
  const combinations = [];
  const n = variables.length;
  const values = bfMode ? ['()0', '()1', '()2', '()3'] : ['()', '(())'];
  for (let i = 0; i < Math.pow(values.length, n); i++) {
    const combination = {};
    for (let j = 0; j < n; j++) {
      combination[variables[j]] = values[Math.floor(i / Math.pow(values.length, j)) % values.length];
    }
    combinations.push(combination);
  }
  return combinations;
};

const truthTable = (str, bfMode) => {
  const variables = [...new Set(str.match(/[A-Za-z]\w*/g) || [])];
  const combinations = generateCombinations(variables, bfMode);
  return combinations.map(combination => {
    let expr = str.split(' ').map(term => {
      if (variables.includes(term)) {
        return combination[term];
      }
      return term.replace(new RegExp(Object.keys(combination).join('|'), 'g'), 
        matched => combination[matched]);
    }).join('');
    const { result, steps } = evaluate(expr, [], bfMode);
    console.log(result);
    return { ...combination, VALUE: result, steps };
  });
};

const LoFTruthTables = () => {
  const [input, setInput] = useState('');
  const [table, setTable] = useState([]);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [bfMode, setBfMode] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark bg-gray-900 text-white' : 'bg-white text-black';
  }, [darkMode]);

  const handleEvaluate = (string_input=undefined) => {
    if (!verify(string_input ?? input)) {
      setError('Invalid bracket structure');
      setTable([]);
      setConsoleOutput('');
      return;
    }
    setError('');
    const results = truthTable(string_input ?? input, bfMode);
    setTable(results);
    
    // Generate console output
    const output = results.map((row, index) => {
      return `Combination ${index + 1}:\n` + 
             Object.entries(row)
               .filter(([key]) => key !== 'steps' && key !== 'VALUE')
               .map(([key, value]) => `${key} = ${value}`)
               .join(', ') + 
             '\nEvaluation steps:\n' + 
             row.steps.join('\n') + 
             '\n\n';
    }).join('');
    
    setConsoleOutput(output);
  };

  const examples = [
    { caption: 'A ^ B', string: '((A)(B))' },
    { caption: 'A v B', string: 'A B' },
    { caption: 'A => B', string: '(A) B' },
    { caption: 'A XOR B', string: '(((A)B) ((B)A))' },
    { caption: 'A = B', string: '((A)B) ((B)A)' },
    { caption: 'BELL', string: '((((X)(Y)))(((A)B) ((B)A))) (((((A)B) ((B)A)))((X)(Y)))' },
    { caption: 'Syllogism', string: '(A)B (B)C (C)A' },
    { caption: 'Triangle Inequality', string: '((A)B) ((B)C) (C)A' },
  ];

  const pieData = table.length ? (
    bfMode
      ? [
          { name: '()0', value: table.filter(row => row.VALUE === '()0').length },
          { name: '()1', value: table.filter(row => row.VALUE === '()1').length },
          { name: '()2', value: table.filter(row => row.VALUE === '()2').length },
          { name: '()3', value: table.filter(row => row.VALUE === '()3').length },
        ]
      : [
          { name: '()', value: table.filter(row => row.VALUE !== '').length },
          { name: '(())', value: table.filter(row => row.VALUE === '').length },
        ]
  ) : [];

  return (
    <div className={`p-4 max-w-4xl mx-auto font-sans ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">LoF Truth Tables</h1>
        <div className="flex items-center">
          <Sun className="h-4 w-4 mr-2" />
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
          <Moon className="h-4 w-4 ml-2" />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex flex-col md:flex-col gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => {setInput(e.target.value)}}
            className="w-full p-2 m-2 border rounded dark:bg-gray-800 dark:text-white"
            placeholder="Enter expression"
          />
          <div className="pl-4 pb-4 flex-row text-[20px]">
            {"Z = "}{ !bfMode ?<LoF style={{fontSize: '20px', height: '100%'}}
              className=""
            >  
              {input}
          </LoF> : input}
          </div>
        </div>
        
        <button
          onClick={()=>handleEvaluate()}
          className="mt-2 m-4 px-4 py-2 bg-blue-500 text-white rounded dark:bg-blue-700"
        >
          Evaluate
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => {setInput(example.string); handleEvaluate(example.string);}}
            className="px-3 py-1 bg-gray-200 rounded dark:bg-gray-700"
          >
            {example.caption}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="flex items-center mb-4">
        <span className="mr-2">LoF Mode</span>
        <Switch
          checked={bfMode}
          onChange={() => {setBfMode(!bfMode); handleEvaluate()}}
          className={`${
            bfMode ? 'bg-blue-600' : 'bg-gray-200'
          } relative inline-flex h-6 w-11 items-center rounded-full`}
        >
          <span className="sr-only">Enable BF Mode</span>
          <span
            className={`${
              bfMode ? 'translate-x-6' : 'translate-x-1'
            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </Switch>
        <span className="ml-2">BF Mode</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {table.length > 0 && (
          <>
            <div className="flex-1 overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(table[0]).filter(key => key !== 'steps').map((key) => (
                        <th key={key} className="border p-2 dark:border-gray-600">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row, index) => (
                      <tr key={index}>
                        {Object.entries(row).filter(([key]) => key !== 'steps').map(([key, value], i) => (
                          <td key={i} className="border p-2 dark:border-gray-600">
                            {!bfMode && key === 'VALUE' ? (value === '' ?
                              <LoF style={{fontSize: '10px', height: '100%'}}
                                  className="text-[10px] h-1"
                                >  
                                  (())
                              </LoF>
                              : <LoF style={{fontSize: '10px', height: '100%'}}
                                className="text-[10px] h-1"
                              >  
                                ()
                            </LoF>
                              ) : <LoF style={{fontSize: '10px', height: '100%'}}
                                    className="text-[10px] h-1"
                                  >  
                                    {value}
                                </LoF>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <PieChart width={200} height={200}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={darkMode
                        ? ['#FFFF00', '#FF4500', '#228B22', '#1E90FF'][index] // Dark mode colors
                        : ['#FFFFE0', '#FF6347', '#32CD32', '#87CEFA'][index] // Light mode colors
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </>
        )}
      </div>

      {consoleOutput && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Evaluation Console</h2>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto whitespace-pre-wrap">
            {consoleOutput}
          </pre>
        </div>
      )}

      
    </div>
  );
};

export default LoFTruthTables;