#requires -Version 5.1
<#
  Probe Plaid Chrome window for UIA-readable text (lengths only, no secrets).
#>
$ErrorActionPreference = "Stop"

Add-Type -ReferencedAssemblies UIAutomationClient, UIAutomationTypes -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Automation;

public static class PlaidUiProbe
{
    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static object Run()
    {
        var windows = new List<IntPtr>();
        var titles = new List<string>();
        EnumWindows((hWnd, lParam) => {
            var sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, sb.Capacity);
            var title = sb.ToString() ?? "";
            if (title.IndexOf("plaid", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                windows.Add(hWnd);
                titles.Add(title);
            }
            return true;
        }, IntPtr.Zero);

        int valueCount = 0;
        int nameCount = 0;
        int textCount = 0;
        var valueLengths = new List<int>();

        foreach (var hwnd in windows)
        {
            var root = AutomationElement.FromHandle(hwnd);
            if (root == null) continue;
            var all = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
            for (int i = 0; i < all.Count; i++)
            {
                var el = all[i];
                var name = el.Current.Name ?? "";
                if (name.Length >= 16) { nameCount++; valueLengths.Add(name.Length); }
                try
                {
                    object vp;
                    if (el.TryGetCurrentPattern(ValuePattern.Pattern, out vp))
                    {
                        var val = ((ValuePattern)vp).Current.Value ?? "";
                        if (val.Length >= 16) { valueCount++; valueLengths.Add(val.Length); }
                    }
                }
                catch {}
                try
                {
                    object tp;
                    if (el.TryGetCurrentPattern(TextPattern.Pattern, out tp))
                    {
                        var val = ((TextPattern)tp).DocumentRange.GetText(-1) ?? "";
                        if (val.Length >= 16) { textCount++; valueLengths.Add(val.Length); }
                    }
                }
                catch {}
            }
        }

        valueLengths.Sort();
        return new {
            window_count = windows.Count,
            titles = titles.ToArray(),
            name_chunks_16plus = nameCount,
            value_chunks_16plus = valueCount,
            text_chunks_16plus = textCount,
            max_chunk_length = valueLengths.Count > 0 ? valueLengths[valueLengths.Count - 1] : 0
        };
    }
}
"@

$result = [PlaidUiProbe]::Run()
$result | ConvertTo-Json -Depth 4

$clip = (Get-Clipboard -Format Text -ErrorAction SilentlyContinue)
if ($clip) {
  $lines = @($clip -split "`r?`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  @{
    clipboard_line_count = $lines.Count
    clipboard_has_24char_token = @($lines | Where-Object { $_ -match '^[A-Za-z0-9_-]{20,40}$' }).Count
    clipboard_has_long_token = @($lines | Where-Object { $_ -match '^[A-Za-z0-9_-]{30,80}$' }).Count
  } | ConvertTo-Json
}
