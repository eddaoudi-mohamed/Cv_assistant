import re

def escape_latex(text: str) -> str:
    """
    Escapes special LaTeX characters in a string.
    """
    if not text:
        return ""
    # Order of replacements is important
    replacements = {
        "&": r"\\&",
        "%": r"\\%",
        "$": r"\\$",
        "#": r"\\#",
        "_": r"\\_",
        "{": r"\\{",
        "}": r"\\}",
        "~": r"\\textasciitilde{}",
        "^": r"\\textasciicircum{}",
        "\\": r"\\textbackslash{}",
    }
    # Create a regex pattern to find all special characters
    # The characters are escaped for regex safety
    pattern = re.compile("|".join(re.escape(k) for k in replacements.keys()))
    # Replace each found character with its LaTeX-safe version
    return pattern.sub(lambda m: replacements[m.group(0)], text)

def strip_markdown_fences(text: str) -> str:
    """
    Removes markdown code fences from a string.
    """
    if not text:
        return ""
    return re.sub(r"```(latex)?|```", "", text).strip()
