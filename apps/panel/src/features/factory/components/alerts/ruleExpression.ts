import type {
  CreateRule,
  LeafRule,
  RuleCombinator,
  RuleExpression,
  RuleOperator,
  RuleValueType,
  SeverityRule,
} from "@paapeli/api";

/* A stored rule comes back with its conditions flattened to the script the
   gateway generated from them: `return ((temperature > 30) && (mode == "on"))`.
   Editing needs the conditions back, so this reads that script. It only reads
   what the gateway writes (LeafRule/RuleGroup.toJavaScript): every leaf and
   every group in parentheses, `&&`/`||` between siblings, and JSON literals.
   Anything else yields null and the form starts from an empty condition. */

const OPERATORS: Record<string, RuleOperator> = {
  ">": "GT", "<": "LT", "==": "EQ", "!=": "NEQ", ">=": "GTE", "<=": "LTE",
};

export const parseTriggerExpression = (script: string): RuleExpression | null => {
  const src = script.trim().replace(/^return\s+/, "").trim();
  let i = 0;
  const skip = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const eat = (s: string) => {
    skip();
    if (!src.startsWith(s, i)) return false;
    i += s.length;
    return true;
  };

  const literal = (): { value: unknown; valueType: RuleValueType } | null => {
    skip();
    if (src[i] === '"') {
      // A JSON string: find its closing quote, skipping escapes.
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j += src[j] === "\\" ? 2 : 1;
      if (j >= src.length) return null;
      try {
        const value = JSON.parse(src.slice(i, j + 1));
        i = j + 1;
        return { value, valueType: "STRING_LITERAL" };
      } catch { return null; }
    }
    const word = /^(true|false|null|-?\d+(\.\d+)?([eE][+-]?\d+)?)/.exec(src.slice(i));
    if (!word) return null;
    i += word[0].length;
    if (word[0] === "null") return { value: null, valueType: "NULL" };
    if (word[0] === "true" || word[0] === "false") return { value: word[0] === "true", valueType: "BOOLEAN_LITERAL" };
    return { value: Number(word[0]), valueType: "NUMBER_LITERAL" };
  };

  const node = (): RuleExpression | null => {
    if (!eat("(")) return null;
    skip();
    if (src[i] !== "(") {
      // A leaf: (field op literal)
      const field = /^[^\s()=!<>]+/.exec(src.slice(i));
      if (!field) return null;
      i += field[0].length;
      skip();
      const op = /^(>=|<=|==|!=|>|<)/.exec(src.slice(i));
      if (!op) return null;
      i += op[0].length;
      const lit = literal();
      if (!lit || !eat(")")) return null;
      const leaf: LeafRule = { field: field[0], operator: OPERATORS[op[0]], value: lit.value, valueType: lit.valueType };
      return leaf;
    }
    // A group: (child && child && ...), one combinator throughout.
    const rules: RuleExpression[] = [];
    let combinator: RuleCombinator | null = null;
    for (;;) {
      const child = node();
      if (!child) return null;
      rules.push(child);
      if (eat(")")) break;
      const next: RuleCombinator | null = eat("&&") ? "AND" : eat("||") ? "OR" : null;
      if (!next || (combinator && combinator !== next)) return null;
      combinator = next;
    }
    return rules.length === 1 ? rules[0] : { combinator: combinator ?? "AND", rules };
  };

  const tree = node();
  skip();
  return tree && i === src.length ? tree : null;
};

const MINUTES_PER: Partial<Record<NonNullable<SeverityRule["unit"]>, number>> = {
  SECONDS: 1 / 60, MINUTES: 1, HOURS: 60, DAYS: 1440,
};

/** A stored rule's duration in minutes, for the form's time window. */
export const durationMinutes = (rule: SeverityRule): number => {
  if (rule.triggerType !== "DURATION" || !rule.value) return 0;
  return rule.value * (MINUTES_PER[rule.unit ?? "MINUTES"] ?? 1);
};

/** A stored severity rule back as the create body takes it, or null if its script can't be read. */
export const severityRuleToCreateRule = (rule: SeverityRule): CreateRule | null => {
  const expression = parseTriggerExpression(rule.triggerExpression);
  if (!expression) return null;
  switch (rule.triggerType) {
    case "DURATION": return { type: "DURATION", expression, duration: rule.value, unit: rule.unit ?? "MINUTES" };
    case "REPEATING": return { type: "REPEATING", expression, count: rule.count };
    default: return { type: "SIMPLE", expression };
  }
};
