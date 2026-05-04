import re

def check_div_balance(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Simple regex to find <div, <div ... />, and </div>
    # This is naive but might help
    tokens = re.findall(r'<div|/>|</div>', content)
    
    stack = []
    for i, token in enumerate(tokens):
        if token == '<div':
            # Check if it's self-closing in the same line (or shortly after)
            # This is hard with just tokens.
            pass
        
    # Let's try a better approach: find all <div and their corresponding closing or self-closing
    
    # Find all <div
    open_divs = list(re.finditer(r'<div', content))
    close_divs = list(re.finditer(r'</div>', content))
    self_close_divs = list(re.finditer(r'<div[^>]*/>', content))
    
    print(f"Total <div: {len(open_divs)}")
    print(f"Total </div>: {len(close_divs)}")
    print(f"Total self-closing <div: {len(self_close_divs)}")
    
    # A non-self-closing <div should be matched by a </div>
    # Total <div - Total self-closing should equal Total </div>
    
    expected_closings = len(open_divs) - len(self_close_divs)
    print(f"Expected </div>: {expected_closings}")
    print(f"Actual </div>: {len(close_divs)}")
    
    if expected_closings != len(close_divs):
        print("IMBALANCE DETECTED!")
    else:
        print("BALANCED (according to simple regex)")

check_div_balance('client/src/pages/DashboardPage.tsx')
