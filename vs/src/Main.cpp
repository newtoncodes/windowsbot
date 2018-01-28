#include "stdafx.h"
#include "main.h"
#include <node.h>
#include <string>
#include <v8.h>
#include <uv.h>
#include <iostream>
#include "Capturer.h"


using namespace v8;
using namespace std;


static Capturer capturer = Capturer();

//

struct CaptureWindowJobRegions {
    uv_work_t  request;
    Persistent<Function> callback;
    HWND hwnd;
    BYTE* data[100];
    int count = 0;
    int regions[100][4];
};


static void CaptureWindowAsyncRegions(uv_work_t *req) {
    CaptureWindowJobRegions *work = static_cast<CaptureWindowJobRegions *>(req->data);

    int left = 1000000;
    int top = 1000000;
    int right = 0;
    int bottom = 0;

    for (int i = 0, l = work->count; i < l; i++) {
        int l1 = work->regions[i][0];
        int t1 = work->regions[i][1];
        int r1 = l1 + work->regions[i][2];
        int b1 = t1 + work->regions[i][3];

        if (l1 < left) left = l1;
        if (t1 < top) top = t1;
        if (r1 > right) right = r1;
        if (b1 > bottom) bottom = b1;
    }

    Bmp whole = capturer.CaptureWindow(work->hwnd, NULL, false, left, top, right - left, bottom - top);

    for (int i = 0, l = work->count; i < l; i++) {
        Bmp tmp = capturer.Crop(whole, work->regions[i][0] - left, work->regions[i][1] - top, work->regions[i][2], work->regions[i][3]);
        
        work->data[i] = tmp.data;
        work->regions[i][2] = tmp.width;
        work->regions[i][3] = tmp.height;
        //work->size = tmp.size;
    }
}

static void CaptureWindowAsyncRegionsCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    CaptureWindowJobRegions *work = static_cast<CaptureWindowJobRegions *>(req->data);

    Local<Array> regions = Array::New(isolate, work->count);

    for (int r = 0, l = work->count; r < l; r++) {
        int n = (work->regions[r][2] * work->regions[r][3]) * 3;

        Local<Object> region = Object::New(isolate);
        Local<Array> pixels = Array::New(isolate, n);

        for (int i = 0; i < n; i++) pixels->Set(i, v8::Integer::New(isolate, (int32_t)work->data[r][i]));

        region->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, work->regions[r][0]));
        region->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, work->regions[r][1]));
        region->Set(String::NewFromUtf8(isolate, "width"), Number::New(isolate, work->regions[r][2]));
        region->Set(String::NewFromUtf8(isolate, "height"), Number::New(isolate, work->regions[r][3]));
        region->Set(String::NewFromUtf8(isolate, "pixels"), pixels);

        regions->Set(r, region);
    }

    Handle<Value> argv[] = { regions };

    // Execute the callback
    Local<Function>::New(isolate, work->callback)->Call(isolate->GetCurrentContext()->Global(), 1, argv);

    // Free up the persistent function callback
    work->callback.Reset();

    delete work;
}

void CaptureWindowRegions(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR)args[0]->IntegerValue();

    int size = (args.Length() - 2) / 4;

    CaptureWindowJobRegions * work = new CaptureWindowJobRegions();
    work->request.data = work;

    int r = 0;
    for (int i = 1, l = args.Length() - 1; i < l; i += 4) {
        work->regions[r][0] = (int)args[i]->IntegerValue();
        work->regions[r][1] = (int)args[i + 1]->IntegerValue();
        work->regions[r][2] = (int)args[i + 2]->IntegerValue();
        work->regions[r][3] = (int)args[i + 3]->IntegerValue();

        r ++;
    }

    Local<Function> callback = Local<Function>::Cast(args[1 + size * 4]);
    work->callback.Reset(isolate, callback);
    work->hwnd = (HWND) hwnd;
    work->count = size;

    uv_queue_work(uv_default_loop(), &work->request, CaptureWindowAsyncRegions, CaptureWindowAsyncRegionsCallback);

    args.GetReturnValue().Set(Undefined(isolate));
}






//

struct CaptureWindowJob {
    uv_work_t  request;
    Persistent<Function> callback;
    BYTE* data;
    int width = 0;
    int height = 0;
    int size = 0;
    int x = 0;
    int y = 0;
    int w = 0;
    int h = 0;
    bool save = false;
    bool desktop = false;
    LPSTR file;
    HWND hwnd;
    int* regions[100][4];
    int regionsCount = 0;
};

static void CaptureWindowAsync(uv_work_t *req) {
    CaptureWindowJob *work = static_cast<CaptureWindowJob *>(req->data);

    Bmp tmp;

    if (work->desktop) tmp = capturer.CaptureDesktop(work->file, work->save, work->x, work->y, work->w, work->h);
    else tmp = capturer.CaptureWindow(work->hwnd, work->file, work->save, work->x, work->y, work->w, work->h);

    work->data = tmp.data;
    work->width = tmp.width;
    work->height = tmp.height;
    work->size = tmp.size;
}

static void CaptureWindowAsyncCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    CaptureWindowJob *work = static_cast<CaptureWindowJob *>(req->data);

    int n = (work->width * work->height) * 3;

    Local<Array> pixels = Array::New(isolate, n);

    for (int i = 0; i < n; i++) pixels->Set(i, v8::Integer::New(isolate, (int32_t)work->data[i]));

    // Set up return arguments
    Handle<Value> argv[] = {
        Integer::New(isolate, (int32_t)work->width),
        Integer::New(isolate, (int32_t)work->height),
        pixels
    };

    // Execute the callback
    Local<Function>::New(isolate, work->callback)->Call(isolate->GetCurrentContext()->Global(), 3, argv);

    // Free up the persistent function callback
    work->callback.Reset();

    delete work;
}

void CaptureWindow(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR)args[0]->IntegerValue();
    int x = (int)args[1]->IntegerValue();
    int y = (int)args[2]->IntegerValue();
    int w = (int)args[3]->IntegerValue();
    int h = (int)args[4]->IntegerValue();

    v8::String::Utf8Value param6(args[5]->ToString());
    LPSTR file = _strdup(std::string(*param6).c_str());

    bool save = args[6]->BooleanValue();

    CaptureWindowJob * work = new CaptureWindowJob();
    work->request.data = work;

    Local<Function> callback = Local<Function>::Cast(args[7]);
    work->callback.Reset(isolate, callback);
    work->hwnd = (HWND)hwnd;
    work->x = x;
    work->y = y;
    work->w = w;
    work->h = h;
    work->file = file;
    work->save = save;
    work->desktop = false;

    uv_queue_work(uv_default_loop(), &work->request, CaptureWindowAsync, CaptureWindowAsyncCallback);

    args.GetReturnValue().Set(Undefined(isolate));
}

void CaptureDesktop(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int x = (int)args[0]->IntegerValue();
    int y = (int)args[1]->IntegerValue();
    int w = (int)args[2]->IntegerValue();
    int h = (int)args[3]->IntegerValue();

    v8::String::Utf8Value param6(args[4]->ToString());
    LPSTR file = _strdup(std::string(*param6).c_str());

    bool save = args[5]->BooleanValue();

    CaptureWindowJob * work = new CaptureWindowJob();
    work->request.data = work;

    Local<Function> callback = Local<Function>::Cast(args[6]);
    work->callback.Reset(isolate, callback);
    work->hwnd = (HWND)0;
    work->x = x;
    work->y = y;
    work->w = w;
    work->h = h;
    work->file = file;
    work->save = save;
    work->desktop = true;

    uv_queue_work(uv_default_loop(), &work->request, CaptureWindowAsync, CaptureWindowAsyncCallback);

    args.GetReturnValue().Set(Undefined(isolate));
}



//

struct RedrawWindowJob {
    uv_work_t  request;
    Persistent<Function> callback;
    HWND hwnd;
    UINT flags;
    int x = 0;
    int y = 0;
    int w = 0;
    int h = 0;
    bool result = false;
};

static void RedrawWindowAsync(uv_work_t *req) {
    RedrawWindowJob *work = static_cast<RedrawWindowJob *>(req->data);

    RECT rect = { 0 };
    rect.left = work->x;
    rect.right = work->x + work->w;
    rect.top = work->y;
    rect.bottom = work->y + work->h;

    if (work->w == 0 && work->h == 0) {
        if (work->hwnd == 0) work->result = RedrawWindow(NULL, NULL, NULL, work->flags);
        else work->result = RedrawWindow(work->hwnd, NULL, NULL, work->flags);
    }
    else {
        if (work->hwnd == 0) work->result = RedrawWindow(NULL, &rect, NULL, work->flags);
        else work->result = RedrawWindow(work->hwnd, &rect, NULL, work->flags);
    }
}

static void RedrawWindowAsyncCallback(uv_work_t *req, int status) {
    Isolate * isolate = Isolate::GetCurrent();
    v8::HandleScope handleScope(isolate);

    RedrawWindowJob *work = static_cast<RedrawWindowJob *>(req->data);
    
    // Set up return arguments
    Handle<Value> argv[] = { Boolean::New(isolate, work->result) };

    // Execute the callback
    Local<Function>::New(isolate, work->callback)->Call(isolate->GetCurrentContext()->Global(), 1, argv);

    // Free up the persistent function callback
    work->callback.Reset();

    delete work;
}

void RedrawWin(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    LONG_PTR hwnd = (LONG_PTR)args[0]->IntegerValue();
    int x = (int)args[1]->IntegerValue();
    int y = (int)args[2]->IntegerValue();
    int w = (int)args[3]->IntegerValue();
    int h = (int)args[4]->IntegerValue();
    UINT flags = (UINT)args[5]->IntegerValue();

    RedrawWindowJob * work = new RedrawWindowJob();
    work->request.data = work;

    Local<Function> callback = Local<Function>::Cast(args[6]);
    work->callback.Reset(isolate, callback);
    work->hwnd = (HWND) hwnd;
    work->x = x;
    work->y = y;
    work->w = w;
    work->h = h;
    work->flags = flags;

    uv_queue_work(uv_default_loop(), &work->request, RedrawWindowAsync, RedrawWindowAsyncCallback);

    args.GetReturnValue().Set(Undefined(isolate));
}

void RedrawDesktop(const FunctionCallbackInfo<Value>& args) {
    Isolate* isolate = args.GetIsolate();

    int x = (int)args[0]->IntegerValue();
    int y = (int)args[1]->IntegerValue();
    int w = (int)args[2]->IntegerValue();
    int h = (int)args[3]->IntegerValue();
    UINT flags = (UINT)args[4]->IntegerValue();

    RedrawWindowJob * work = new RedrawWindowJob();
    work->request.data = work;

    Local<Function> callback = Local<Function>::Cast(args[5]);
    work->callback.Reset(isolate, callback);
    work->hwnd = (HWND)0;
    work->x = x;
    work->y = y;
    work->w = w;
    work->h = h;
    work->flags = flags;

    uv_queue_work(uv_default_loop(), &work->request, RedrawWindowAsync, RedrawWindowAsyncCallback);

    args.GetReturnValue().Set(Undefined(isolate));
}


void InitAll(Local<Object> exports) {
    NODE_SET_METHOD(exports, "captureWindow", CaptureWindow);
    NODE_SET_METHOD(exports, "captureDesktop", CaptureDesktop);
    NODE_SET_METHOD(exports, "captureWindowRegions", CaptureWindowRegions);
    NODE_SET_METHOD(exports, "redrawDesktop", RedrawDesktop);
    NODE_SET_METHOD(exports, "redrawWindow", RedrawWin);
}

NODE_MODULE(screener, InitAll);