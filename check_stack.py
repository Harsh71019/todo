import re

def check_div_balance_stack(file_path):
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    stack = []
    
    for line_num, line in enumerate(lines, 1):
        # Find all relevant tags in the line
        # We need to handle <div, <div ... />, and </div>
        
        # This is tricky because a tag can span multiple lines.
        # Let's just look for the start and end of tags.
        pass

    # Actually, let's use a simpler way to find the imbalance.
    # We'll just print every line that has a <div or </div> and keep track of depth.
    
    depth = 0
    content = "".join(lines)
    
    # Replace self-closing divs with a placeholder so we don't count them
    # But wait, self-closing divs can span multiple lines.
    
    # Let's remove self-closing divs
    content_no_self = re.sub(r'<div[^>]*/>', 'SELF_DIV', content)
    
    # Now find all <div and </div>
    tokens = re.finditer(r'<div|</div>', content_no_self)
    
    for match in tokens:
        tag = match.group()
        pos = match.start()
        # Find line number
        line_num = content_no_self.count('\n', 0, pos) + 1
        
        if tag == '<div':
            depth += 1
            print(f"L{line_num}: Open  (Depth: {depth})")
        else:
            depth -= 1
            print(f"L{line_num}: Close (Depth: {depth})")
            
    if depth != 0:
        print(f"FINAL DEPTH: {depth} - IMBALANCE!")
    else:
        print("BALANCED")

check_div_balance_stack('client/src/pages/DashboardPage.tsx')
