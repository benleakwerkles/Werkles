# Toggle off Xbox Game Bar recording (Win+Alt+R).
. "$PSScriptRoot\send-gamebar-record.ps1" 2>$null
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Threading;
public static class GameBarStop {
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    public static void WinAltR() {
        const byte VK_LWIN = 0x5B; const byte VK_MENU = 0x12; const byte VK_R = 0x52;
        keybd_event(VK_LWIN,0,0,0); keybd_event(VK_MENU,0,0,0); keybd_event(VK_R,0,0,0);
        Thread.Sleep(100);
        keybd_event(VK_R,0,2,0); keybd_event(VK_MENU,0,2,0); keybd_event(VK_LWIN,0,2,0);
    }
}
"@
Write-Output "GAMEBAR: STOP Win+Alt+R"
[GameBarStop]::WinAltR()
