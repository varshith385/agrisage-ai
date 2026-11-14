import math

def rel_lum(hex_str):
    hex_str = hex_str.lstrip('#')
    r, g, b = [int(hex_str[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
    def adj(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * adj(r) + 0.7152 * adj(g) + 0.0722 * adj(b)

def contrast(c1, c2):
    l1 = rel_lum(c1)
    l2 = rel_lum(c2)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

# Standard tokens
tokens = {
    "Deep Field Green (Primary)": "#1B5E3B",
    "Page Warm Off-White": "#FFFDF8",
    "Card White": "#FFFFFF",
    "Near-Black Body Text": "#1F2A24",
    "Secondary Muted Text": "#4A5750",
    "Water Blue": "#1565A8",
    "Amber Highlight": "#F2B01E",
    "Soil Brown": "#7A553A",
    "Success Green": "#2E7D32",
    "Warning Amber (Base)": "#B26A00",
    "Warning Amber (Adjusted for 4.5:1 text)": "#9E5B00",
    "Danger Red": "#B3261E",
    "Info Blue": "#1565A8",
    "Card Border": "#D9D4C7",
}

pairs = [
    ("Near-Black #1F2A24 on Warm Off-White #FFFDF8 (Page background)", "#1F2A24", "#FFFDF8", "Body Text (>=7:1)"),
    ("Near-Black #1F2A24 on Card White #FFFFFF", "#1F2A24", "#FFFFFF", "Body Text (>=7:1)"),
    ("White #FFFFFF on Deep Field Green #1B5E3B (Primary buttons/headers)", "#FFFFFF", "#1B5E3B", "Button/Header Text (>=4.5:1)"),
    ("Secondary Text #4A5750 on Card White #FFFFFF", "#4A5750", "#FFFFFF", "Secondary Text (>=7:1)"),
    ("Secondary Text #4A5750 on Warm Off-White #FFFDF8", "#4A5750", "#FFFDF8", "Secondary Text (>=7:1)"),
    ("Near-Black Text #1F2A24 on Amber Accent #F2B01E", "#1F2A24", "#F2B01E", "Amber Button/Badge (>=7:1)"),
    ("White #FFFFFF on Water Blue #1565A8", "#FFFFFF", "#1565A8", "Water Button/Badge (>=4.5:1)"),
    ("Success #2E7D32 text on Card White #FFFFFF", "#2E7D32", "#FFFFFF", "Status Text (>=4.5:1)"),
    ("Warning Adjusted #9E5B00 text on Card White #FFFFFF", "#9E5B00", "#FFFFFF", "Status Text (>=4.5:1)"),
    ("Danger #B3261E text on Card White #FFFFFF", "#B3261E", "#FFFFFF", "Status Text (>=4.5:1)"),
    ("Info #1565A8 text on Card White #FFFFFF", "#1565A8", "#FFFFFF", "Status Text (>=4.5:1)"),
    ("Soil Brown #7A553A on Card White #FFFFFF", "#7A553A", "#FFFFFF", "Accent Text / Icons (>=4.5:1)"),
    ("Near-Black #1F2A24 on Success Tint #E8F5E9", "#1F2A24", "#E8F5E9", "Status Badge Fill (>=7:1)"),
    ("Near-Black #1F2A24 on Warning Tint #FFF8E1", "#1F2A24", "#FFF8E1", "Status Badge Fill (>=7:1)"),
    ("Near-Black #1F2A24 on Danger Tint #FFEBEE", "#1F2A24", "#FFEBEE", "Status Badge Fill (>=7:1)"),
    ("Near-Black #1F2A24 on Info Tint #E3F2FD", "#1F2A24", "#E3F2FD", "Status Badge Fill (>=7:1)"),
]

print("| Text / Foreground | Background | Ratio | Requirement | Result |")
print("|---|---|---|---|---|")
for name, fg, bg, req in pairs:
    cr = contrast(fg, bg)
    status = "PASS" if (( ">=7:1" in req and cr >= 7.0) or (">=4.5:1" in req and cr >= 4.5) or (">=3:1" in req and cr >= 3.0)) else "FAIL"
    print(f"| `{fg}` | `{bg}` | **{cr:.2f}:1** | {req} | **{status}** |")
