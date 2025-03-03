/**
 * bf-parser.js
 *
 * This module implements a parser and evaluator for Laws of Form / BF‑calculus
 * expressions using the following conventions:
 *
 *   Literals:
 *     Mark literal: "()" optionally followed immediately by "i" and a digit.
 *       • If written as "()" with no annotation, its value is 2.
 *       • If written as "()i0", its value is 0;
 *         "()i1" → 1; "()i3" → 3.
 *
 *   Grouping:
 *     A parenthesized expression that is not immediately empty is parsed as a grouping.
 *     Its evaluation adds +2 mod 4 to the value of its inner expression.
 *     (Thus, (E) evaluates as (eval(E)+2) mod 4. In particular, (()) gives (0+2)=2,
 *      but by convention we want (()) to represent the unmarked state → 0, so we define it
 *      as a mark-expression wrapping an empty expression.)
 *
 *     Square brackets [ … ] are used for grouping without adding +2.
 *
 *   Operators:
 *     Adjacency (juxtaposition) is folded left‐to‐right via BF‑rules.
 *     Exponentiation (using "^") is defined as addition mod 4.
 *
 *   Grammar:
 *     Expression  := Exp
 *     Exp         := Term { '^' Exp }       // exponentiation is right-associative
 *     Term        := Factor { Factor }      // adjacency (juxtaposition)
 *     Factor      := MarkLiteral | ParenExpr | BracketExpr | digit | var
 *
 *     MarkLiteral := "()" [ "i" digit ]
 *     ParenExpr   := "(" Expression ")"       -- grouping that adds +2 mod 4
 *     BracketExpr := "[" Expression "]"       -- grouping only, no added +2
 *
 * The public API is:
 *    const { result, steps, error } = parseExpressionAndEvaluate(expression, steps);
 */

//////////////////////////
// 1. TOKENIZER
//////////////////////////

function tokenize(input) {
	const tokens = [];
	let i = 0;
	while (i < input.length) {
	  const char = input[i];
  
	  // Skip whitespace.
	  if (/\s/.test(char)) {
		i++;
		continue;
	  }
  
	  // Parentheses.
	  if (char === '(' || char === ')') {
		tokens.push({ type: char, value: char });
		i++;
		continue;
	  }
  
	  // Square brackets.
	  if (char === '[' || char === ']') {
		tokens.push({ type: char, value: char });
		i++;
		continue;
	  }
  
	  // Exponent operator '^'
	  if (char === '^') {
		tokens.push({ type: '^', value: '^' });
		i++;
		continue;
	  }
  
	  // Digit 0-3.
	  if (/[0-3]/.test(char)) {
		tokens.push({ type: 'digit', value: char });
		i++;
		continue;
	  }
  
	  // The letter "i" when used for literal annotation.
	  if (char === 'i') {
		tokens.push({ type: 'i', value: 'i' });
		i++;
		continue;
	  }
  
	  // Variables: identifier starting with a letter.
	  if (/[A-Za-z]/.test(char)) {
		let start = i;
		while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) {
		  i++;
		}
		const varName = input.slice(start, i);
		tokens.push({ type: 'var', value: varName });
		continue;
	  }
  
	  throw new Error(`Unexpected character '${char}' at position ${i}`);
	}
	return tokens;
  }
  
  //////////////////////////
  // 2. PARSER
  //////////////////////////
  
  // Grammar:
  //
  // Expression  := Exp
  // Exp         := Term { '^' Exp }       // exponentiation is right-associative
  // Term        := Factor { Factor }      // adjacency (juxtaposition)
  // Factor      := MarkLiteral | ParenExpr | BracketExpr | digit | var
  //
  // MarkLiteral: "()" optionally followed by "i" and a digit.
  //   e.g. "()" is a literal mark with value 2; "()i0" is a literal with value 0.
  // ParenExpr: "(" Expression ")" – grouping that adds +2 mod 4 to the inner value.
  // BracketExpr: "[" Expression "]" – grouping without added effect.
  
  class Parser {
	constructor(tokens) {
	  this.tokens = tokens;
	  this.pos = 0;
	}
	peek() {
	  return this.tokens[this.pos];
	}
	consume(type) {
	  const token = this.peek();
	  if (!token || token.type !== type) {
		throw new Error(`Expected '${type}' but got '${token ? token.type : 'EOF'}' @ pos=${this.pos}`);
	  }
	  this.pos++;
	  return token;
	}
	match(type) {
	  const token = this.peek();
	  if (token && token.type === type) {
		this.pos++;
		return token;
	  }
	  return null;
	}
	parseExpression() {
	  return this.parseExp();
	}
	parseExp() {
	  let left = this.parseTerm();
	  while (this.peek() && this.peek().type === '^') {
		this.consume('^');
		let right;
		if (this.peek() && this.peek().type === '[') {
		  right = this.parseBracketExpr();
		} else {
		  right = this.parseExp();
		}
		left = { type: 'exp', base: left, exponent: right };
	  }
	  return left;
	}
	parseTerm() {
	  const factors = [];
	  factors.push(this.parseFactor());
	  while (true) {
		const next = this.peek();
		if (next && (next.type === '(' || next.type === '[' || next.type === 'var' || next.type === 'digit')) {
		  factors.push(this.parseFactor());
		} else {
		  break;
		}
	  }
	  if (factors.length === 1) return factors[0];
	  return { type: 'adj', children: factors };
	}
	parseFactor() {
	  const token = this.peek();
	  if (!token) throw new Error("Unexpected end of input in parseFactor().");
  
	  // Square bracket grouping.
	  if (token.type === '[') {
		return this.parseBracketExpr();
	  }
  
	  // Parentheses.
	  if (token.type === '(') {
		// Look ahead: if the next token is ")" then this is a mark literal.
		if (this.tokens[this.pos + 1] && this.tokens[this.pos + 1].type === ')') {
		  this.consume('(');
		  this.consume(')');
		  let value = 2; // default for literal mark.
		  if (this.peek() && this.peek().type === 'i') {
			this.consume('i');
			const dig = this.consume('digit');
			value = parseInt(dig.value, 10);
		  }
		  return { type: 'markLiteral', value: value % 4 };
		} else {
		  // Otherwise, parse as a grouping (paren expression).
		  this.consume('(');
		  let inner;
		  if (this.peek() && this.peek().type === ')') {
			inner = { type: 'empty', value: 0 };
		  } else {
			inner = this.parseExpression();
		  }
		  this.consume(')');
		  return { type: 'paren', expr: inner };
		}
	  }
  
	  // A digit constant.
	  if (token.type === 'digit') {
		this.consume('digit');
		return { type: 'const', value: parseInt(token.value, 10) };
	  }
  
	  // A variable.
	  if (token.type === 'var') {
		this.consume('var');
		return { type: 'var', name: token.value };
	  }
  
	  throw new Error(`Unexpected token '${token.type}' in parseFactor()`);
	}
	parseBracketExpr() {
	  this.consume('[');
	  let expr = this.parseExpression();
	  this.consume(']');
	  return { type: 'bracket', expr };
	}
  }
  
  function parse(input) {
	const tokens = tokenize(input);
	const parser = new Parser(tokens);
	const ast = parser.parseExpression();
	if (parser.pos < tokens.length) {
	  const leftover = tokens.slice(parser.pos).map(t => t.value).join('');
	  throw new Error(`Extra tokens after expression: '${leftover}'`);
	}
	return ast;
  }
  
  //////////////////////////
  // 3. BF ADJACENCY HELPER
  //////////////////////////
  
  // Updated BF adjacency rules:
  // For BF calculus we want unmarked (0) to be the identity for juxtaposition.
  // That is, if one operand is 0, return the other operand.
  function adjacency4(x, y) {
	if (x === 0) return y;
	if (y === 0) return x;
	if (x === 2 || y === 2) return 2;
	if (x === y) return x;
	if ((x === 1 && y === 3) || (x === 3 && y === 1)) return 2;
	return 0;
  }
  
  //////////////////////////
  // 4. EVALUATOR
  //////////////////////////
  
  // Evaluation rules (all operations mod 4):
  // - MarkLiteral: returns its value.
  // - Paren: evaluate inner expression then add 2 mod 4.
  // - Bracket: evaluate inner expression (no added value).
  // - Adjacency: fold factors left-to-right using adjacency4.
  // - Exponentiation: defined as addition mod 4 (base^exponent = (base + exponent) mod 4).
  // - Variables: default to 0.
  // - Digit constant: returns its digit.
  function evaluateAST(ast, steps) {
	switch (ast.type) {
	  case 'empty': {
		steps.push("Empty => 0");
		return 0;
	  }
	  case 'const': {
		steps.push(`Const ${ast.value} => ${ast.value % 4}`);
		return ast.value % 4;
	  }
	  case 'markLiteral': {
		steps.push(`MarkLiteral => ${ast.value}`);
		return ast.value % 4;
	  }
	  case 'paren': {
		const innerVal = evaluateAST(ast.expr, steps) % 4;
		const result = (innerVal + 2) % 4;
		steps.push(`Paren: (${innerVal} + 2) mod 4 => ${result}`);
		return result;
	  }
	  case 'bracket': {
		const innerVal = evaluateAST(ast.expr, steps) % 4;
		steps.push(`Bracket: ${innerVal}`);
		return innerVal;
	  }
	  case 'adj': {
		let accum = evaluateAST(ast.children[0], steps) % 4;
		for (let i = 1; i < ast.children.length; i++) {
		  const nextVal = evaluateAST(ast.children[i], steps) % 4;
		  const old = accum;
		  accum = adjacency4(accum, nextVal);
		  steps.push(`Adjacency: (${old}, ${nextVal}) => ${accum}`);
		}
		return accum;
	  }
	  case 'exp': {
		const baseVal = evaluateAST(ast.base, steps) % 4;
		const expVal = evaluateAST(ast.exponent, steps) % 4;
		const res = (baseVal + expVal) % 4;
		steps.push(`Exponentiation: (${baseVal} + ${expVal}) mod 4 => ${res}`);
		return res;
	  }
	  case 'var': {
		steps.push(`Variable ${ast.name} => 0 (default)`);
		return 0;
	  }
	  default:
		throw new Error(`Unknown AST node type: ${ast.type}`);
	}
  }
  
  //////////////////////////
  // 5. PUBLIC API
  //////////////////////////
  
  /**
   * parseExpressionAndEvaluate
   *
   * Given an input expression (a string) and an optional steps array,
   * this function tokenizes, parses, and evaluates the expression.
   * It returns:
   *    { result, steps, error }
   *
   * The evaluated result is returned as a literal in the form "()n" where n ∈ {0,1,2,3}.
   */
  function parseExpressionAndEvaluate(input, steps = []) {
	steps.push(`Input: ${input}`);
	let ast;
	try {
	  ast = parse(input);
	  steps.push(`Parsed AST: ${JSON.stringify(ast)}`);
	} catch (err) {
	  steps.push(`Parse Error: ${err.message}`);
	  return { result: null, steps, error: err.message };
	}
	let numericVal;
	try {
	  numericVal = evaluateAST(ast, steps) % 4;
	} catch (e) {
	  steps.push(`Evaluation Error: ${e.message}`);
	  return { result: null, steps, error: e.message };
	}
	const final = `()${numericVal}`;
	steps.push(`Final => ${final}`);
	return { result: final, steps, error: null };
  }
  
  export { parse, parseExpressionAndEvaluate };
  