#requires -Version 5.1
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes | Out-Null
Add-Type @"
using System; using System.Collections.Generic; using System.Runtime.InteropServices; using System.Text; using System.Windows.Automation;
public static class PlaidWinList {
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc f, IntPtr l);
  public delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int c);
  public static string[] Run() {
    var t = new List<string>();
    EnumWindows((h,l)=>{ var sb=new StringBuilder(512); GetWindowText(h,sb,512); var x=sb.ToString(); if(!string.IsNullOrWhiteSpace(x)) t.Add(x); return true;}, IntPtr.Zero);
    return t.ToArray();
  }
}
"@
[PlaidWinList]::Run() | Where-Object { $_ -match 'plaid|Plaid|Chrome|Keys' } | Select-Object -First 25
