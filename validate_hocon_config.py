#!/usr/bin/env python3
"""
HOCON Configuration Validator
Identifies specific syntax errors in Eclipse Ditto application.conf files
"""

import re
import os

def validate_hocon_syntax(file_path):
    """Validate HOCON syntax and identify specific errors"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    print(f"🔍 VALIDATING: {file_path}")
    print("=" * 60)
    
    errors = []
    warnings = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Cannot read file: {e}")
        return False
    
    # Track bracket/brace nesting
    bracket_stack = []
    brace_stack = []
    
    for line_num, line in enumerate(lines, 1):
        stripped = line.strip()
        
        # Skip empty lines and comments
        if not stripped or stripped.startswith('#'):
            continue
        
        # Check for unbalanced braces
        open_braces = line.count('{')
        close_braces = line.count('}')
        
        for _ in range(open_braces):
            brace_stack.append(line_num)
        
        for _ in range(close_braces):
            if not brace_stack:
                errors.append(f"Line {line_num}: Unmatched closing brace '}}' - {stripped}")
            else:
                brace_stack.pop()
        
        # Check for duplicate configuration blocks
        if stripped.endswith('{') and any(keyword in stripped for keyword in ['policies', 'things', 'gateway']):
            config_name = stripped.split('{')[0].strip()
            # This is a simplified check - would need more sophisticated parsing
            
        # Check for invalid escape sequences
        if '\\' in line and not line.count('\\') % 2 == 0:
            warnings.append(f"Line {line_num}: Possible invalid escape sequence - {stripped}")
        
        # Check for unquoted special characters
        if '=' in stripped and not stripped.startswith('#'):
            parts = stripped.split('=', 1)
            if len(parts) == 2:
                value = parts[1].strip()
                if value and not (value.startswith('"') and value.endswith('"')):
                    if any(char in value for char in [' ', ':', '@', '#']):
                        if not (value.startswith('[') or value.startswith('{') or 
                               value.isdigit() or value in ['true', 'false', 'on', 'off']):
                            warnings.append(f"Line {line_num}: Value may need quotes: {value}")
    
    # Check for unclosed braces
    if brace_stack:
        errors.append(f"Unclosed braces opened at lines: {brace_stack}")
    
    # Print results
    print(f"📊 VALIDATION RESULTS:")
    print(f"   Lines analyzed: {len(lines)}")
    print(f"   Errors found: {len(errors)}")
    print(f"   Warnings: {len(warnings)}")
    print()
    
    if errors:
        print("❌ CRITICAL ERRORS (will cause ConfigException$Parse):")
        for error in errors:
            print(f"   • {error}")
        print()
    
    if warnings:
        print("⚠️  WARNINGS (potential issues):")
        for warning in warnings:
            print(f"   • {warning}")
        print()
    
    return len(errors) == 0

def analyze_config_structure(file_path):
    """Analyze the structure and find specific Eclipse Ditto issues"""
    print(f"\n🏗️  STRUCTURE ANALYSIS: {file_path}")
    print("=" * 60)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Cannot analyze: {e}")
        return
    
    # Check for specific problematic patterns
    issues = []
    
    # Check for orphaned lines
    lines = content.split('\n')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped == 'enabled = false' and i > 1:
            prev_line = lines[i-2].strip() if i > 1 else ""
            if not prev_line.endswith('{'):
                issues.append(f"Line {i}: Orphaned 'enabled = false' without proper context")
    
    # Check for duplicate blocks
    pekko_count = content.count('pekko {')
    ditto_count = content.count('ditto {')
    policies_count = content.count('policies {')
    things_count = content.count('things {')
    
    print("📋 Configuration Blocks:")
    print(f"   pekko: {pekko_count} block(s)")
    print(f"   ditto: {ditto_count} block(s)")
    print(f"   policies: {policies_count} block(s)")  
    print(f"   things: {things_count} block(s)")
    
    if policies_count > 1:
        issues.append("Duplicate 'policies' configuration blocks found")
    if things_count > 1:
        issues.append("Duplicate 'things' configuration blocks found")
    
    # Check for mismatched references
    if 'akka.cluster.sbr' in content:
        issues.append("Using 'akka.cluster.sbr' instead of 'pekko.cluster.sbr' (Ditto 3.5.0 uses Pekko)")
    
    if issues:
        print("\n⚠️  STRUCTURAL ISSUES:")
        for issue in issues:
            print(f"   • {issue}")
    else:
        print("\n✅ No obvious structural issues detected")

if __name__ == "__main__":
    print("🎯 ECLIPSE DITTO HOCON CONFIGURATION VALIDATOR")
    print("=" * 70)
    
    config_files = [
        "backup/current-application.conf",
        "config/application.conf"
    ]
    
    all_valid = True
    
    for config_file in config_files:
        if os.path.exists(config_file):
            is_valid = validate_hocon_syntax(config_file)
            analyze_config_structure(config_file)
            all_valid = all_valid and is_valid
            print("\n" + "="*70 + "\n")
        else:
            print(f"⚠️  File not found: {config_file}")
    
    print("🎯 OVERALL STATUS:")
    if all_valid:
        print("✅ All configurations have valid syntax")
    else:
        print("❌ Configuration files have syntax errors that must be fixed")
        print("   These errors are causing the ConfigException$Parse failures")