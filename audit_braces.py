
import re

def audit_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    
    # Simple state machine to ignore strings and comments
    in_string = False
    string_char = None
    string_start = None
    in_comment = False # //
    in_block_comment = False # /* */
    block_comment_start = None

    for line_idx, line in enumerate(lines):
        i = 0
        while i < len(line):
            char = line[i]
            
            if in_comment:
                if char == '\n':
                    in_comment = False
                i += 1
                continue
            
            if in_block_comment:
                if line[i:i+2] == '*/':
                    in_block_comment = False
                    i += 2
                else:
                    i += 1
                continue
                
            if in_string:
                if char == '\\':
                    i += 2
                    continue
                if char == string_char:
                    in_string = False
                i += 1
                continue
                
            # Start comments
            if line[i:i+2] == '//':
                in_comment = True
                i += 2
                continue
            if line[i:i+2] == '/*':
                in_block_comment = True
                block_comment_start = (line_idx + 1, i + 1)
                i += 2
                continue
                
            # Start strings
            if char in ['"', "'", '`']:
                in_string = True
                string_char = char
                string_start = (line_idx + 1, i + 1)
                i += 1
                continue
                
            # Braces
            if char in ['{', '(', '[']:
                stack.append((char, line_idx + 1, i + 1))
            elif char in ['}', ')', ']']:
                if not stack:
                    # Ignore unexpected closing for now to focus on unclosed
                    pass
                else:
                    last_open, last_line, last_col = stack.pop()
                    # simple match check

            i += 1

    if in_string:
        print(f"Error: Unclosed string starting at {string_start}")
    if in_block_comment:
        print(f"Error: Unclosed block comment starting at {block_comment_start}")
    
    if stack:
        print("Final Unclosed Braces:")
        for item in stack:
            print(f"  {item}")

audit_file('src/components/ai/AIAssistantChat.tsx')
