#!/usr/bin/env python3
"""
PreToolUse hook: blocks Write/Edit on JSON files that contain a German opening
quote (U+201E) closed by ASCII " (U+0022). Correct closing quote is U+201C.
"""
import sys, json, os

def find_violations(text):
    violations = []
    i = 0
    while i < len(text):
        if text[i] == '„':
            j = i + 1
            while j < len(text) and text[j] != '\n':
                c = text[j]
                if c == '"':
                    if j == 0 or text[j - 1] != '\\':
                        violations.append(repr(text[i:j + 1][:60]))
                        break
                elif c in ('“', '”'):
                    break
                j += 1
        i += 1
    return violations

def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    tool_name = data.get('tool_name', '')
    tool_input = data.get('tool_input', {})
    file_path = tool_input.get('file_path', '')

    if not file_path.endswith('.json'):
        sys.exit(0)

    if tool_name == 'Write':
        content = tool_input.get('content', '')
    elif tool_name == 'Edit':
        content = tool_input.get('new_string', '')
    else:
        sys.exit(0)

    violations = find_violations(content)
    if not violations:
        sys.exit(0)

    reason = (
        'German quote error in ' + os.path.basename(file_path) + ':\n'
        'Found „..." (ASCII closing quote). '
        'Use “ instead.\n'
        'Violations: ' + ', '.join(violations[:3])
    )
    print(json.dumps({
        'hookSpecificOutput': {
            'hookEventName': 'PreToolUse',
            'permissionDecision': 'deny',
            'permissionDecisionReason': reason
        }
    }))

main()
