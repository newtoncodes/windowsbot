#ifndef __INPUT__
#define __INPUT__

#include "Vec2.h"


class Mouse {
public:
    static Vec2 getPosition() {
        POINT p;
        GetCursorPos(&p);
        Vec2 v;
        v.Set(p.x, p.y);
        return v;
    }

    static void down(int button = 0) {
        INPUT input[1];

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_MOUSE;
        if (button == 2) input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MIDDLEDOWN;
        else if (button == 1) input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_RIGHTDOWN;
        else input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTDOWN;

        Vec2 p = getPosition();
        long screenWidth = ::GetSystemMetrics(SM_CXSCREEN) - 1;
        long screenHeight = ::GetSystemMetrics(SM_CYSCREEN) - 1;
        input[0].mi.dx = (long)(p.x * (65535.0f / screenWidth));
        input[0].mi.dy = (long)(p.y * (65535.0f / screenHeight));

        SendInput(1, input, sizeof(INPUT));
    }

    static void up(int button = 0) {
        INPUT input[1];

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_MOUSE;
        if (button == 2) input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MIDDLEUP;
        else if (button == 1) input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_RIGHTUP;
        else input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_LEFTUP;

        Vec2 p = getPosition();
        long screenWidth = ::GetSystemMetrics(SM_CXSCREEN) - 1;
        long screenHeight = ::GetSystemMetrics(SM_CYSCREEN) - 1;
        input[0].mi.dx = (long)(p.x * (65535.0f / screenWidth));
        input[0].mi.dy = (long)(p.y * (65535.0f / screenHeight));

        SendInput(1, input, sizeof(INPUT));
    }

    static void move(double x, double y) {
        INPUT input[1];

        // TODO: optimize
        long screenWidth = ::GetSystemMetrics(SM_CXSCREEN) - 1;
        long screenHeight = ::GetSystemMetrics(SM_CYSCREEN) - 1;

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_MOUSE;
        input[0].mi.dx = x * (65535.0f / screenWidth);
        input[0].mi.dy = y * (65535.0f / screenHeight);
        input[0].mi.dwFlags = MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_MOVE;

        SendInput(1, input, sizeof(INPUT));
    }
};


class Keyboard {
public:
    static void keyDown(unsigned short k) {
        INPUT input[1];

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = 0;
        input[0].ki.wScan = MapVirtualKey(k, 0);
        input[0].ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_UNICODE;
        input[0].ki.time = 0;
        input[0].ki.dwExtraInfo = NULL;

        SendInput(1, input, sizeof(INPUT));
    }

    static void keyUp(unsigned short k) {
        INPUT input[1];

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = 0;
        input[0].ki.wScan = MapVirtualKey(k, 0);
        input[0].ki.dwFlags = KEYEVENTF_KEYUP | KEYEVENTF_SCANCODE | KEYEVENTF_UNICODE;
        input[0].ki.time = 0;
        input[0].ki.dwExtraInfo = NULL;

        SendInput(1, input, sizeof(INPUT));
    }

    static void charDown(unsigned short key) {
        INPUT input[1];

        // HKL locale = LoadKeyboardLayoutA("00000C00", KLF_ACTIVATE); // Current
        HKL locale = LoadKeyboardLayoutA("00000409", KLF_ACTIVATE); // US

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = 0;
        input[0].ki.wScan = MapVirtualKeyExW(VkKeyScanExW(key, locale) & 0xFF, MAPVK_VK_TO_VSC, locale);
        input[0].ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_UNICODE;
        input[0].ki.time = 0;
        input[0].ki.dwExtraInfo = NULL;

        SendInput(1, input, sizeof(INPUT));
    }

    static void charUp(unsigned short key) {
        INPUT input[1];

        // HKL locale = LoadKeyboardLayoutA("00000C00", KLF_ACTIVATE); // Current
        HKL locale = LoadKeyboardLayoutA("00000409", KLF_ACTIVATE); // US

        ZeroMemory(&input[0], sizeof(INPUT));
        input[0].type = INPUT_KEYBOARD;
        input[0].ki.wVk = 0;
        input[0].ki.wScan = MapVirtualKeyExW(VkKeyScanExW(key, locale) & 0xFF, MAPVK_VK_TO_VSC, locale);
        input[0].ki.dwFlags = KEYEVENTF_KEYUP | KEYEVENTF_SCANCODE | KEYEVENTF_UNICODE;
        input[0].ki.time = 0;
        input[0].ki.dwExtraInfo = NULL;

        SendInput(1, input, sizeof(INPUT));
    }
};


class Windows {
public:
    static void activate(HWND hwnd) {
        SetActiveWindow(hwnd);
    }

    static void focus(HWND hwnd) {
        SetFocus(hwnd);
    }

    static void setForegroundWindow(HWND hwnd) {
        SetForegroundWindow(hwnd);
    }

    static HWND getForegroundWindow() {
        return GetForegroundWindow();
    }
};

#endif