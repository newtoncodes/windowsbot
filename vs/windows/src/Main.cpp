#include "stdafx.h"
#include "main.h"
#include <node.h>
#include <uv.h>
#include <iostream>

#define _WIN32_WINNT 0x0400
#pragma comment(lib, "user32.lib")

#include <windows.h>
#include <stdio.h>

using namespace v8;

void _GetTopWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    LONG_PTR hwnd2 = (LONG_PTR)GetTopWindow((HWND) hwnd);

    args.GetReturnValue().Set(Integer::New(isolate, (int32_t)hwnd2));
}

void _GetActiveWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR)GetActiveWindow();

    args.GetReturnValue().Set(Integer::New(isolate, (int32_t)hwnd));
}

void _GetForegroundWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR) GetForegroundWindow();

    args.GetReturnValue().Set(Integer::New(isolate, (int32_t)hwnd));
}

void _GetFocus(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR) GetFocus();

    args.GetReturnValue().Set(Integer::New(isolate, (int32_t) hwnd));
}

void _GetWindowRect(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    RECT rect;

    LONG_PTR hwnd = args[0]->IntegerValue();
    GetWindowRect((HWND) hwnd, &rect);

    Local<Object> pos = Object::New(isolate);
    pos->Set(String::NewFromUtf8(isolate, "left"), Number::New(isolate, (long) rect.left));
    pos->Set(String::NewFromUtf8(isolate, "top"), Number::New(isolate, (long) rect.top));
    pos->Set(String::NewFromUtf8(isolate, "right"), Number::New(isolate, (long)rect.right));
    pos->Set(String::NewFromUtf8(isolate, "bottom"), Number::New(isolate, (long)rect.bottom));

    args.GetReturnValue().Set(pos);
}

void _IsWindowVisible(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    bool isVisible = IsWindowVisible((HWND)hwnd);

    args.GetReturnValue().Set(Boolean::New(isolate, isVisible));
}

void _IsWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    bool isWindow = IsWindow((HWND) hwnd);

    args.GetReturnValue().Set(Boolean::New(isolate, isWindow));
}

void _GetWindowText(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();

    int bufsize = GetWindowTextLength((HWND)hwnd) + 1;
    LPWSTR title = new WCHAR[bufsize];
    GetWindowText((HWND)hwnd, (LPSTR) title, bufsize);

    //LPSTR lpString = "";
    //bool isWindow = GetWindowText((HWND)hwnd, lpString, 1000);

    const char * lpStringChar = (const char *)title;

    args.GetReturnValue().Set(String::NewFromUtf8(isolate, lpStringChar));
}

///

void _SetActiveWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    SetActiveWindow((HWND)hwnd);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _SetForegroundWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    SetForegroundWindow((HWND)hwnd);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _SetFocus(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    SetFocus((HWND)hwnd);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _SetWindowRect(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    int x = args[1]->IntegerValue();
    int y = args[2]->IntegerValue();
    int width = args[3]->IntegerValue();
    int height = args[4]->IntegerValue();
    SetWindowPos((HWND)hwnd, NULL, x, y, width, height, 0);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _ShowWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    ShowWindow((HWND)hwnd, SW_SHOW);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _HideWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    ShowWindow((HWND)hwnd, SW_HIDE);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _MinimizeWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    ShowWindow((HWND)hwnd, SW_MINIMIZE);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _MaximizeWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    ShowWindow((HWND)hwnd, SW_MAXIMIZE);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _UnmaximizeWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    ShowWindow((HWND)hwnd, SW_NORMAL);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _MoveWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    double x = args[1]->NumberValue();
    double y = args[2]->NumberValue();
    double width = args[3]->NumberValue();
    double height = args[4]->NumberValue();
    bool repaint = args[5]->BooleanValue();
    MoveWindow((HWND) hwnd, x, y, width, height, repaint);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _SwitchToThisWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    bool altTab = args[1]->BooleanValue();
    SwitchToThisWindow((HWND)hwnd, altTab);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _FlashWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    bool invert = args[1]->BooleanValue();
    FlashWindow((HWND) hwnd, invert);

    args.GetReturnValue().Set(Undefined(isolate));
}

void _CloseWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = args[0]->IntegerValue();
    CloseWindow((HWND) hwnd);

    args.GetReturnValue().Set(Undefined(isolate));
}


static std::string* windowTitles = new std::string[1000];
static LONG_PTR* windowHwnds = new LONG_PTR[1000];
static unsigned int windowsCount = 0;

BOOL CALLBACK EnumWindowsProc(HWND hwnd, LPARAM param) {
    char title[80];
    GetWindowText(hwnd, title, sizeof(title));

    windowTitles[windowsCount] = title;
    windowHwnds[windowsCount] = (LONG_PTR)hwnd;
    windowsCount++;

    return TRUE;
}

void _GetWindows(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    Local<Function> cb = Local<Function>::Cast(args[0]);

    windowsCount = 0;
    EnumWindows(EnumWindowsProc, 0);

    Local<Array> windows = Array::New(isolate, windowsCount);

    for (int i = 0; i < windowsCount; i++) {
        Local<Object> win = Object::New(isolate);
        win->Set(String::NewFromUtf8(isolate, "hwnd"), Number::New(isolate, (double)windowHwnds[i]));
        win->Set(String::NewFromUtf8(isolate, "title"), String::NewFromUtf8(isolate, windowTitles[i].c_str()));

        windows->Set(i, win);
    }

    args.GetReturnValue().Set(windows);
}


//
// Main

void InitAll(Local<Object> exports) {
    NODE_SET_METHOD(exports, "getTopWindow", _GetTopWindow);
    NODE_SET_METHOD(exports, "getActiveWindow", _GetActiveWindow);
    NODE_SET_METHOD(exports, "getForegroundWindow", _GetForegroundWindow);
    NODE_SET_METHOD(exports, "getFocus", _GetFocus);
    NODE_SET_METHOD(exports, "getWindowRect", _GetWindowRect);
    NODE_SET_METHOD(exports, "isWindowVisible", _IsWindowVisible);
    NODE_SET_METHOD(exports, "isWindow", _IsWindow);
    NODE_SET_METHOD(exports, "getWindowText", _GetWindowText);
    NODE_SET_METHOD(exports, "setActiveWindow", _SetActiveWindow);
    NODE_SET_METHOD(exports, "setForegroundWindow", _SetForegroundWindow);
    NODE_SET_METHOD(exports, "setFocus", _SetFocus);
    NODE_SET_METHOD(exports, "setWindowRect", _SetWindowRect);
    NODE_SET_METHOD(exports, "showWindow", _ShowWindow);
    NODE_SET_METHOD(exports, "hideWindow", _HideWindow);
    NODE_SET_METHOD(exports, "minimizeWindow", _MinimizeWindow);
    NODE_SET_METHOD(exports, "maximizeWindow", _MaximizeWindow);
    NODE_SET_METHOD(exports, "unmaximizeWindow", _UnmaximizeWindow);
    NODE_SET_METHOD(exports, "moveWindow", _MoveWindow);
    NODE_SET_METHOD(exports, "switchToThisWindow", _SwitchToThisWindow);
    NODE_SET_METHOD(exports, "flashWindow", _FlashWindow);
    NODE_SET_METHOD(exports, "closeWindow", _CloseWindow);
    NODE_SET_METHOD(exports, "getWindows", _GetWindows);
}

NODE_MODULE(windows, InitAll);