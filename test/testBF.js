const evaluateBF = (str, steps = []) => {
	const simplifyBF = (s) => {
		// Remove all whitespace from the input string
		s = s.replace(/\s+/g, '');

		const rules = {
			'\(\)1\(\)3': '()2', '\(\)3\(\)1': '()2', '\(\)1\(\)1': '()1', '()3()3': '()3',
			'\(\)3\(\)0': '()3', '\(\)1\(\)0': '()1', '\(\)1\(\)2': '()2', '()2()1': '()2',
			'\(\)2\(\)2': '()2', '\(\)3\(\)2': '()2', '\(\)2\(\)3': '()2',
		};

		// HERE
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
			r = `${s}`;
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

// Define a dictionary of test cases
const testCases = {
  '((())1()2()3)': '()0',
  '()1()2()3': '()2',
  '()3()3()3': '()3',
  '(()1)2': '()3',
  '(())': '()0',
  // Add more test cases as needed
};

// Function to run tests and collect results
const runTests = () => {
  const results = [];
  
  for (const [input, expectedOutput] of Object.entries(testCases)) {
    const { result } = evaluateBF(input);
    const passed = result === expectedOutput;
    
    results.push({
      input,
      expectedOutput,
      actualOutput: result,
      passed
    });
  }
  
  return results;
};

// Run tests and log results
const testResults = runTests();
console.log('Test Results:');
testResults.forEach(({ input, expectedOutput, actualOutput, passed }, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`  Input: ${input}`);
  console.log(`  Expected: ${expectedOutput}`);
  console.log(`  Actual: ${actualOutput}`);
  console.log(`  Passed: ${passed ? 'Yes' : 'No'}`);
  console.log('---');
});

// Log summary
const passedTests = testResults.filter(result => result.passed).length;
console.log(`Passed ${passedTests} out of ${testResults.length} tests`);
