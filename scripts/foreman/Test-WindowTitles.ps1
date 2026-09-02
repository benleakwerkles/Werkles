#requires -Version 5.1
Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class WinTitles {
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc f, IntPtr l);
  delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  public static string[] All() {
    var list = new List<string>();
    EnumWindows((h,l)=>{ var sb=new StringBuilder(512); GetWindowText(h,sb,512); var t=sb.ToString(); if(!string.IsNullOrWhiteSpace(t)) list.Add(t); return true;}, IntPtr.Zero);
    return list.ToArray();
  }
}
"@
[WinTitles]::All() | Where-Object { $_ -match 'Plaid|plaid|Chrome|Keys|Developer' }
