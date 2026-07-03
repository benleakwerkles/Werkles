# Sends Win+G then Win+Alt+R to start Xbox Game Bar screen recording.
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Threading;
public static class GameBarKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    const byte VK_LWIN = 0x5B;
    const byte VK_MENU = 0x12;
    const byte VK_R = 0x52;
    const uint KEYDOWN = 0;
    const uint KEYUP = 2;
    static void Down(byte vk) { keybd_event(vk, 0, KEYDOWN, 0); }
    static void Up(byte vk) { keybd_event(vk, 0, KEYUP, 0); }
    public static void WinG() {
        Down(VK_LWIN); Down(0x47); Thread.Sleep(100); Up(0x47); Up(VK_LWIN);
    }
    public static void WinAltR() {
        Down(VK_LWIN); Down(VK_MENU); Down(VK_R); Thread.Sleep(100);
        Up(VK_R); Up(VK_MENU); Up(VK_LWIN);
    }
}
"@

Write-Output "GAMEBAR: Win+G"
[GameBarKeys]::WinG()
Start-Sleep -Seconds 2
Write-Output "GAMEBAR: Win+Alt+R"
[GameBarKeys]::WinAltR()
Write-Output "GAMEBAR: RECORD_TOGGLE_SENT"
