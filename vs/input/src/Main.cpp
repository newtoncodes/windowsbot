#include "stdafx.h"
#include "main.h"
#include <node.h>
#include <uv.h>
#include <iostream>

#define _WIN32_WINNT 0x0400
#pragma comment(lib, "user32.lib")
#pragma comment(linker, "/section:ASEG,RWS")

#include <windows.h>
#include <stdio.h>
#include "Input.h"

using namespace v8;

HHOOK hKeyboardHook;
HHOOK hMouseHook;
static Persistent<Function> keyboardCallback = Persistent<Function>();
static Persistent<Function> mouseCallback = Persistent<Function>();
bool keyboardSubscribed = false;
bool mouseSubscribed = false;

uv_async_t asyncKeyboard;
uv_async_t asyncMouse;

struct KeyboardEventData {
    int32_t key;
    bool down;
};

struct MouseEventData {
    char * type;
    int32_t x;
    int32_t y;
    int32_t button;
    int32_t delta;
};

struct LoggerJob {
    uv_work_t  request;
    Persistent<Function> callback;
};

void MessageLoop() {
    MSG message;
    while (GetMessage(&message, NULL, 0, 0)) {
        TranslateMessage(&message);
        DispatchMessage(&message);
    }
}


//
// Keyboard

LRESULT CALLBACK KeyboardEvent(int nCode, WPARAM wParam, LPARAM lParam) {
    if ((nCode == HC_ACTION) && ((wParam == WM_SYSKEYDOWN) || (wParam == WM_KEYDOWN) || (wParam == WM_SYSKEYUP) || (wParam == WM_KEYUP))) {
        KBDLLHOOKSTRUCT hooked_key = *((KBDLLHOOKSTRUCT*)lParam);
        DWORD dwMsg = 1;
        dwMsg += hooked_key.scanCode << 16;
        dwMsg += hooked_key.flags << 24;

        unsigned short key = hooked_key.vkCode;
        unsigned short realDeal = MapVirtualKey(key, MAPVK_VK_TO_CHAR);

        if (realDeal == 0) realDeal = key;

        /*if (key >= 'A' && key <= 'Z') {
            bool shift = ((GetKeyState(VK_SHIFT) & 0x8000) != 0);
            bool caps = ((GetKeyState(VK_CAPITAL) & 0x0001) != 0);

            if ((!shift && !caps) || (caps && shift)) key += 32;
        }*/

        KeyboardEventData data = KeyboardEventData();
        data.key = (int32_t) realDeal;
        data.down = (wParam == WM_SYSKEYDOWN) || (wParam == WM_KEYDOWN);
        asyncKeyboard.data = (void*) &data;
        uv_async_send(&asyncKeyboard);
    }

    return CallNextHookEx(hKeyboardHook, nCode, wParam, lParam);
}

static void KeyboardLogger(uv_work_t *req) {
    LoggerJob *work = static_cast<LoggerJob *>(req->data);

    HINSTANCE hInstance = GetModuleHandle(NULL);
    //if (!hInstance) hInstance = LoadLibrary((LPCSTR) lpParm);
    //if (!hInstance) return;

    hKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, (HOOKPROC) KeyboardEvent, hInstance, NULL);
    MessageLoop();
    UnhookWindowsHookEx(hKeyboardHook);

    return;
}

void KeyboardEventHandler(uv_async_t *async) {
    KeyboardEventData *data = static_cast<KeyboardEventData *>(async->data);

    Isolate * isolate = Isolate::GetCurrent();
    HandleScope handleScope(isolate);

    Local<Value> argv[] = {
        Integer::New(isolate, data->key),
        Boolean::New(isolate, data->down)
    };

    Local<Function>::New(isolate, keyboardCallback)->Call(isolate->GetCurrentContext()->Global(), 2, argv);
}

static void KeyboardLoggerCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    LoggerJob *work = static_cast<LoggerJob *>(req->data);
    work->callback.Reset();
    delete work;

    uv_close((uv_handle_t*) &asyncKeyboard, NULL);
}

void SubscribeKeyboard(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    keyboardCallback.Reset(isolate, Local<Function>::Cast(args[0]));

    if (!keyboardSubscribed) {
        keyboardSubscribed = true;

        LoggerJob * work = new LoggerJob();
        work->request.data = work;
        Local<Function> callback = Local<Function>::Cast(args[0]);
        work->callback.Reset(isolate, callback);

        uv_async_init(uv_default_loop(), &asyncKeyboard, KeyboardEventHandler);
        uv_queue_work(uv_default_loop(), &work->request, KeyboardLogger, KeyboardLoggerCallback);
    }
}

//
// Mouse

LRESULT CALLBACK MouseEvent(int nCode, WPARAM wParam, LPARAM lParam) {
    MSLLHOOKSTRUCT * pMouseStruct = (MSLLHOOKSTRUCT *) lParam;

    if (pMouseStruct != NULL) {
        bool done = false;
        int x = (int) pMouseStruct->pt.x;
        int y = (int) pMouseStruct->pt.y;
        int delta = -1;
        int button = -1;
        char * type = "";

        if (wParam == WM_LBUTTONDOWN) {
            type = "down";
            button = 0;
            done = true;
        }
        else if (wParam == WM_LBUTTONUP) {
            type = "up";
            button = 0;
            done = true;
        }
        else if (wParam == WM_LBUTTONDBLCLK) {
            type = "doubleClick";
            button = 0;
            done = true;
        }
        else if (wParam == WM_RBUTTONDOWN) {
            type = "down";
            button = 1;
            done = true;
        }
        else if (wParam == WM_RBUTTONUP) {
            type = "up";
            button = 1;
            done = true;
        }
        else if (wParam == WM_RBUTTONDBLCLK) {
            type = "doubleClick";
            button = 1;
            done = true;
        }
        else if (wParam == WM_MBUTTONDOWN) {
            type = "down";
            button = 2;
            done = true;
        }
        else if (wParam == WM_MBUTTONUP) {
            type = "up";
            button = 2;
            done = true;
        }
        else if (wParam == WM_MBUTTONDBLCLK) {
            type = "doubleClick";
            button = 2;
            done = true;
        }
        else if (wParam == WM_MOUSEWHEEL) {
            type = "wheel";
            delta = (int) pMouseStruct->mouseData;
            done = true;
        }
        else if (wParam == WM_MOUSEMOVE) {
            type = "move";
            done = true;
        }

        if (done) {
            MouseEventData data = MouseEventData();
            data.x = (int32_t) x;
            data.y = (int32_t) y;
            data.button = (int32_t)button;
            data.delta = (int32_t) delta;
            data.type = type;
            asyncMouse.data = (void*)&data;
            uv_async_send(&asyncMouse);
        }
    }

    return CallNextHookEx(hMouseHook, nCode, wParam, lParam);
}

static void MouseLogger(uv_work_t *req) {
    LoggerJob *work = static_cast<LoggerJob *>(req->data);

    HINSTANCE hInstance = GetModuleHandle(NULL);

    hMouseHook = SetWindowsHookEx(WH_MOUSE_LL, (HOOKPROC) MouseEvent, hInstance, NULL);
    MessageLoop();
    UnhookWindowsHookEx(hMouseHook);

    return;
}

void MouseEventHandler(uv_async_t *async) {
    MouseEventData *data = static_cast<MouseEventData *>(async->data);

    Isolate * isolate = Isolate::GetCurrent();
    HandleScope handleScope(isolate);

    Local<Value> argv[] = {
        String::NewFromUtf8(isolate, data->type),
        Integer::New(isolate, data->x),
        Integer::New(isolate, data->y),
        Integer::New(isolate, data->button),
        Integer::New(isolate, data->delta)
    };

    Local<Function>::New(isolate, mouseCallback)->Call(isolate->GetCurrentContext()->Global(), 5, argv);
}

static void MouseLoggerCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    LoggerJob *work = static_cast<LoggerJob *>(req->data);
    work->callback.Reset();
    delete work;

    uv_close((uv_handle_t*)&asyncMouse, NULL);
}

void SubscribeMouse(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    mouseCallback.Reset(isolate, Local<Function>::Cast(args[0]));

    if (!mouseSubscribed) {
        mouseSubscribed = true;

        LoggerJob * work = new LoggerJob();
        work->request.data = work;
        Local<Function> callback = Local<Function>::Cast(args[0]);
        work->callback.Reset(isolate, callback);

        uv_async_init(uv_default_loop(), &asyncMouse, MouseEventHandler);
        uv_queue_work(uv_default_loop(), &work->request, MouseLogger, MouseLoggerCallback);
    }
}

void GetKey(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int key = (int) args[0]->IntegerValue();
    bool isDown = ((GetAsyncKeyState(key) & 0x8000) != 0);

    args.GetReturnValue().Set(Boolean::New(isolate, isDown));
}

void GetAllKeys(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    PBYTE buffer = 0;

    Local<Array> ret = Array::New(isolate);
    for (int i = 0; i < 256; i++) {
        ret->Set(i, Boolean::New(isolate, ((GetAsyncKeyState(i) & 0x8000) != 0)));
    }

    args.GetReturnValue().Set(ret);
}

void GetAllLocks(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    bool isCapsLock = ((GetKeyState(VK_CAPITAL) & 0x0001) != 0);
    bool isNumLock = ((GetKeyState(VK_NUMLOCK) & 0x0001) != 0);
    bool isScrollLock = ((GetKeyState(VK_SCROLL) & 0x0001) != 0);

    Local<Array> ret = Array::New(isolate);
    ret->Set(0, Boolean::New(isolate, isCapsLock));
    ret->Set(1, Boolean::New(isolate, isNumLock));
    ret->Set(2, Boolean::New(isolate, isScrollLock));

    args.GetReturnValue().Set(ret);
}

void GetLock(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int key = (int) args[0]->IntegerValue();
    bool isToggled = ((GetKeyState(key) & 0x0001) != 0);

    args.GetReturnValue().Set(Boolean::New(isolate, isToggled));
}


//
// Input

void KeyDown(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    unsigned short k = (unsigned short) args[0]->Int32Value();

    Keyboard::keyDown(k);

    args.GetReturnValue().Set(Undefined(isolate));
}

void KeyUp(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    unsigned short k = (unsigned short) args[0]->Int32Value();
    Keyboard::keyUp(k);

    args.GetReturnValue().Set(Undefined(isolate));
}

void CharDown(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    unsigned short key = (unsigned short)args[0]->Int32Value();
    Keyboard::charDown(key);

    args.GetReturnValue().Set(Undefined(isolate));
}

void CharUp(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    unsigned short key = (unsigned short)args[0]->Int32Value();
    Keyboard::charUp(key);

    args.GetReturnValue().Set(Undefined(isolate));
}

void GetMousePosition(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    Vec2 v = Mouse::getPosition();

    Local<Object> pos = Object::New(isolate);
    pos->ForceSet(String::NewFromUtf8(isolate, "x"), Number::New(isolate, (double)v.x));
    pos->ForceSet(String::NewFromUtf8(isolate, "y"), Number::New(isolate, (double)v.y));

    args.GetReturnValue().Set(pos);
}

void MouseDown(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int button = (int) args[0]->IntegerValue();
    Mouse::down(button);

    args.GetReturnValue().Set(Undefined(isolate));
}

void MouseUp(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int button = (int)args[0]->IntegerValue();
    Mouse::up(button);

    args.GetReturnValue().Set(Undefined(isolate));
}

void MouseMove(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    double x = args[0]->NumberValue();
    double y = args[1]->NumberValue();
    Mouse::move(x, y);

    args.GetReturnValue().Set(Undefined(isolate));
}









//
// Windows

HHOOK hWindowsHook;
static Persistent<Function> windowsCallback = Persistent<Function>();
bool windowsSubscribed = false;

uv_async_t asyncWindows;

struct WindowsEventData {
    int32_t lParam;
    int32_t wParam;
    int32_t nCode;
    int64_t hwnd;
};

LRESULT CALLBACK WindowsEvent(int nCode, WPARAM wParam, LPARAM lParam) {
    cout << "wtf\n";

    WindowsEventData data = WindowsEventData();
    data.lParam = (int32_t)lParam;
    data.wParam = (int32_t)wParam;
    data.nCode = (int32_t)nCode;

    asyncWindows.data = (void*)&data;
    uv_async_send(&asyncWindows);

    //CallWndRetProc
    return CallNextHookEx(hWindowsHook, nCode, wParam, lParam);
}

static void WindowsLogger(uv_work_t *req) {
    LoggerJob *work = static_cast<LoggerJob *>(req->data);

    HINSTANCE hInstance = GetModuleHandle(NULL);
    //if (!hInstance) hInstance = LoadLibrary((LPCSTR) lpParm);
    //if (!hInstance) return;

    /*
    Therefore, any application that registers itself as the default shell must call the SystemParametersInfo function before it (or any other application) can receive WH_SHELL messages.
    This function must be called with SPI_SETMINIMIZEDMETRICS and a MINIMIZEDMETRICS structure. Set the iArrange member of this structure to ARW_HIDE.
   
    MINIMIZEDMETRICS * sett = new MINIMIZEDMETRICS();
    sett->iArrange = ARW_HIDE;
    SystemParametersInfo(SPI_SETMINIMIZEDMETRICS, 0, (PVOID) sett, 0);
    */

    MINIMIZEDMETRICS st;
    st.cbSize = sizeof(MINIMIZEDMETRICS);
    st.iArrange = ARW_HIDE;
    BOOL ret;

    ret = SystemParametersInfo(SPI_SETMINIMIZEDMETRICS, sizeof(MINIMIZEDMETRICS), &st, 0);

    cout << "wtf222\n";

    hWindowsHook = SetWindowsHookEx(WH_CBT, (HOOKPROC)WindowsEvent, NULL, NULL);
    MessageLoop();
    UnhookWindowsHookEx(hWindowsHook);

    return;
}

void WindowsEventHandler(uv_async_t *async) {
    WindowsEventData *data = static_cast<WindowsEventData *>(async->data);

    Isolate * isolate = Isolate::GetCurrent();
    HandleScope handleScope(isolate);

    Local<Value> argv[] = {
        Boolean::New(isolate, data->hwnd),
        Boolean::New(isolate, data->nCode),
        Integer::New(isolate, data->lParam),
        Boolean::New(isolate, data->wParam)
    };

    Local<Function>::New(isolate, windowsCallback)->Call(isolate->GetCurrentContext()->Global(), 2, argv);
}

static void WindowsLoggerCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    LoggerJob *work = static_cast<LoggerJob *>(req->data);
    work->callback.Reset();
    delete work;

    uv_close((uv_handle_t*)&asyncWindows, NULL);
}

void SubscribeWindows(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();
    windowsCallback.Reset(isolate, Local<Function>::Cast(args[0]));

    if (!windowsSubscribed) {
        windowsSubscribed = true;

        LoggerJob * work = new LoggerJob();
        work->request.data = work;
        Local<Function> callback = Local<Function>::Cast(args[0]);
        work->callback.Reset(isolate, callback);

        uv_async_init(uv_default_loop(), &asyncWindows, WindowsEventHandler);
        uv_queue_work(uv_default_loop(), &work->request, WindowsLogger, WindowsLoggerCallback);
    }
}

//
// Main

void InitAll(Local<Object> exports) {
    NODE_SET_METHOD(exports, "subscribeKeyboard", SubscribeKeyboard);
    NODE_SET_METHOD(exports, "subscribeMouse", SubscribeMouse);

    NODE_SET_METHOD(exports, "keyDown", KeyDown);
    NODE_SET_METHOD(exports, "keyUp", KeyUp);
    NODE_SET_METHOD(exports, "charDown", CharDown);
    NODE_SET_METHOD(exports, "charUp", CharUp);
    NODE_SET_METHOD(exports, "getMousePosition", GetMousePosition);
    NODE_SET_METHOD(exports, "mouseDown", MouseDown);
    NODE_SET_METHOD(exports, "mouseUp", MouseUp);
    NODE_SET_METHOD(exports, "mouseMove", MouseMove);

    NODE_SET_METHOD(exports, "getKey", GetKey);
    NODE_SET_METHOD(exports, "getAllKeys", GetAllKeys);
    NODE_SET_METHOD(exports, "getLock", GetLock);
    NODE_SET_METHOD(exports, "getAllLocks", GetAllLocks);


    //
    NODE_SET_METHOD(exports, "subscribeWindows", SubscribeWindows);
}

NODE_MODULE(input, InitAll);























