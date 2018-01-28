#include "stdafx.h"
#include "Capturer.h"

#include <stdio.h>
#include <fcntl.h>
#include <io.h>
#include <iostream>


Capturer::Capturer() {
    m_Width = 0;
    m_Height = 0;
    m_Bpp = 0;
}

Capturer::~Capturer() {

}

void Capturer::SaveBmpToFile(LPTSTR szFileName, int Width, int Height, int Bpp, int* lpBits) {
    BITMAPINFO Bmi = { 0 };
    Bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    Bmi.bmiHeader.biWidth = Width;
    Bmi.bmiHeader.biHeight = -Height;
    Bmi.bmiHeader.biPlanes = 1;
    Bmi.bmiHeader.biBitCount = Bpp;
    Bmi.bmiHeader.biCompression = BI_RGB;
    Bmi.bmiHeader.biSizeImage = Width*Height*Bpp / 8;

    FILE* fp = fopen (szFileName,"wb");
    if (fp == 0) return;

    BITMAPFILEHEADER bfh = { 0 };
    bfh.bfType = ('M' << 8) + 'B';
    bfh.bfOffBits = sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER);
    bfh.bfSize = Bmi.bmiHeader.biSizeImage + bfh.bfOffBits;

    long fullSize = Width * Height * 3;

    fwrite(&bfh, sizeof(bfh), 1, fp);
    fwrite(&Bmi.bmiHeader, sizeof(BITMAPINFOHEADER), 1, fp);
    fwrite(lpBits, Bmi.bmiHeader.biSizeImage, 1, fp);
    fclose(fp);
}

void Capturer::Get24BitBmp(const int nWidth, const int nHeight, const HBITMAP &hBitmap, BYTE *lpDesBits) {
    HDC hDC = ::GetDC(0);
    HDC memDC1 = ::CreateCompatibleDC(hDC);
    HDC memDC2 = ::CreateCompatibleDC(hDC);

    BYTE *lpBits = NULL;

    BITMAPINFO bmi;
    ::ZeroMemory(&bmi, sizeof(BITMAPINFO));
    bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bmi.bmiHeader.biWidth = nWidth;
    bmi.bmiHeader.biHeight = nHeight;
    bmi.bmiHeader.biPlanes = 1;
    bmi.bmiHeader.biBitCount = 24;
    bmi.bmiHeader.biCompression = BI_RGB;

    HBITMAP hDIBMemBM = ::CreateDIBSection(0, &bmi, DIB_RGB_COLORS, (void**)&lpBits, NULL, NULL);

    HBITMAP hOldBmp1 = (HBITMAP)::SelectObject(memDC1, hDIBMemBM);

    HBITMAP hOldBmp2 = (HBITMAP) ::SelectObject(memDC2, hBitmap);

    ::BitBlt(memDC1, 0, 0, nWidth, nHeight, memDC2, 0, 0, SRCCOPY);

    for (int i = 0; i < nHeight; i++) {
        ::CopyMemory(&lpDesBits[i * 3 * nWidth], &lpBits[nWidth * 3 * (nHeight - 1 - i)], nWidth * 3);
    }

    ::SelectObject(memDC1, hOldBmp1);
    ::SelectObject(memDC2, hOldBmp2);
    ::ReleaseDC(0, hDC);
    ::DeleteObject(hDIBMemBM);
    ::DeleteObject(hOldBmp1);
    ::DeleteObject(hOldBmp2);
    ::DeleteDC(memDC1);
    ::DeleteDC(memDC2);
}

Bmp Capturer::CaptureWindow(HWND hWndSrc, LPTSTR lpszFileName, BOOL bSaveToFile, int x, int y, int w = 0, int h = 0) {
    RECT rc = { 0 };
    ::GetWindowRect(hWndSrc, &rc);
    int Width = rc.right - rc.left;
    int Height = rc.bottom - rc.top;
    Width = (Width / 4) * 4;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (x > Width) x = Width;
    if (y > Height) y = Height;

    if (x + w > Width || w == 0) w = Width - x;
    if (y + h > Height || h == 0) h = Height - y;

    int left = x;
    int top = y;
    int right = x + w;
    int bottom = y + h;
        
    HDC		hdc = ::GetDC(0);
    HDC		memDC = ::CreateCompatibleDC(hdc);
    HBITMAP memBM = ::CreateCompatibleBitmap(hdc, Width, Height);
    HBITMAP hOld = (HBITMAP)::SelectObject(memDC, memBM);

    int Bpp = ::GetDeviceCaps(hdc, BITSPIXEL);
    int size = (Bpp / 8) * (Width * Height);
    BYTE *lpBits1 = new BYTE[size];
    BYTE *lpBits2 = new BYTE[Width * Height * 3];
    BYTE *lpBits3 = new BYTE[Width * Height * 3];

    BOOL Ret = TRUE;
    HBITMAP hBmp = 0;
    int MinBlackPixels = Width * Height * 10;
    int Count = 0;
    int Size24 = Width * Height * 3;
    
    //while (Count < 1) {
        Ret = Capture(hWndSrc, memDC);
        ::GetBitmapBits(memBM, size, lpBits1);
        hBmp = ::CreateBitmap(Width, Height, 1, Bpp, lpBits1);
        Get24BitBmp(Width, Height, hBmp, lpBits2);

        /*int BlackPixels = 0;
        for (int i = 0; i<Size24; i += 3) {
            if (lpBits2[i + 2] == 0 && lpBits2[i + 1] == 0 && lpBits2[i + 0] == 0) BlackPixels++;
        }*/

        //if (BlackPixels < MinBlackPixels) {
        //    MinBlackPixels = BlackPixels;
            ::memcpy(lpBits3, lpBits2, Size24);
            Count = 0;
        //}

        //Count++;
        ::DeleteObject(hBmp);
    //}

    ::memcpy(lpBits2, lpBits3, Size24);


    BYTE *finalBits = new BYTE[w * h * 3];
    
    int i1 = top * Width * 3;
    int i2 = 0;
    int length = 0;
    
    for (int yi = 0; yi < h; yi++) {
        i1 += left * 3;

        for (int xi = 0; xi < w; xi++) {
            finalBits[i2 + 0] = lpBits2[i1 + 0];
            finalBits[i2 + 1] = lpBits2[i1 + 1];
            finalBits[i2 + 2] = lpBits2[i1 + 2];

            i1 += 3;
            i2 += 3;
            length += 3;
        }

        i1 += (Width - right) * 3;
    }
    
    if (bSaveToFile) SaveBmpToFile(lpszFileName, w, h, 24, (int*) finalBits);
    
    delete[] lpBits1;
    delete[] lpBits2;
    delete[] lpBits3;
    ::SelectObject(memDC, hOld);
    ::DeleteObject(memBM);
    ::DeleteObject(hBmp);
    ::DeleteDC(memDC);
    ::ReleaseDC(0, hdc);

    Bmp bmp = Bmp();
    bmp.data = finalBits;
    bmp.size = length;
    bmp.width = w;
    bmp.height = h;

    return bmp;
}

Bmp Capturer::Crop(Bmp src, int x, int y, int w = 0, int h = 0) {
    int Width = src.width;
    int Height = src.height;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (x > Width) x = Width;
    if (y > Height) y = Height;

    if (x + w > Width || w == 0) w = Width - x;
    if (y + h > Height || h == 0) h = Height - y;

    int left = x;
    int top = y;
    int right = x + w;
    int bottom = y + h;

    BYTE *finalBits = new BYTE[w * h * 3];

    int i1 = top * Width * 3;
    int i2 = 0;
    int length = 0;

    for (int yi = 0; yi < h; yi++) {
        i1 += left * 3;

        for (int xi = 0; xi < w; xi++) {
            finalBits[i2 + 0] = src.data[i1 + 0];
            finalBits[i2 + 1] = src.data[i1 + 1];
            finalBits[i2 + 2] = src.data[i1 + 2];

            i1 += 3;
            i2 += 3;
            length += 3;
        }

        i1 += (Width - right) * 3;
    }

    Bmp bmp = Bmp();
    bmp.data = finalBits;
    bmp.size = length;
    bmp.width = w;
    bmp.height = h;

    return bmp;
}

Bmp Capturer::CaptureDesktop(LPTSTR lpszFileName, BOOL bSaveToFile, int x, int y, int w = 0, int h = 0) {
    RECT rc;
    HWND hWnd = ::GetDesktopWindow();
    ::GetWindowRect(hWnd, &rc);

    int Width = rc.right - rc.left;
    int Height = rc.bottom - rc.top;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    if (x > Width) x = Width;
    if (y > Height) y = Height;

    if (x + w > Width || w == 0) w = Width - x;
    if (y + h > Height || h == 0) h = Height - y;

    int left = x;
    int top = y;
    int right = x + w;
    int bottom = y + h;

    HDC hDC = ::GetDC(0);
    HDC memDC = ::CreateCompatibleDC(hDC);
    HBITMAP memBM = ::CreateCompatibleBitmap(hDC, Width, Height);
    HBITMAP OldBM = (HBITMAP)::SelectObject(memDC, memBM);
    ::BitBlt(memDC, 0, 0, Width, Height, hDC, rc.left, rc.top, SRCCOPY);

    int Bpp = ::GetDeviceCaps(hDC, BITSPIXEL);
    int size = Bpp / 8 * (Width * Height);
    BYTE *lpBits1 = new BYTE[size];
    ::GetBitmapBits(memBM, size, lpBits1);

    HBITMAP hBmp = ::CreateBitmap(Width, Height, 1, Bpp, lpBits1);

    BYTE *lpBits2 = new BYTE[Width * Height * 3];

    Get24BitBmp(Width, Height, hBmp, lpBits2);


    BYTE *finalBits = new BYTE[w * h * 3];

    int i1 = top * Width * 3;
    int i2 = 0;
    int length = 0;

    for (int yi = 0; yi < h; yi++) {
        i1 += left * 3;

        for (int xi = 0; xi < w; xi++) {
            finalBits[i2 + 0] = lpBits2[i1 + 0];
            finalBits[i2 + 1] = lpBits2[i1 + 1];
            finalBits[i2 + 2] = lpBits2[i1 + 2];

            i1 += 3;
            i2 += 3;
            length += 3;
        }

        i1 += (Width - right) * 3;
    }

    if (bSaveToFile) SaveBmpToFile(lpszFileName, w, h, 24, (int*) finalBits);


    delete[] lpBits1;
    delete[] lpBits2;
    ::SelectObject(hDC, OldBM);
    ::DeleteObject(memBM);
    ::DeleteObject(hBmp);
    ::DeleteDC(memDC);
    ::ReleaseDC(0, hDC);

    Bmp bmp = Bmp();
    bmp.data = finalBits;
    bmp.size = length;
    bmp.width = w;
    bmp.height = h;

    return bmp;
}

BOOL Capturer::Capture(HWND hwnd, HDC memDC) {
    typedef BOOL(WINAPI *tPrintWindow)(HWND, HDC, UINT);

    tPrintWindow pPrintWindow = 0;
    HINSTANCE handle = ::LoadLibrary("User32.dll");
    if (handle == 0)
        return FALSE;

    pPrintWindow = (tPrintWindow)::GetProcAddress(handle, "PrintWindow");
    int Ret = TRUE;
    if (pPrintWindow)
        Ret = pPrintWindow(hwnd, memDC, PW_CLIENTONLY);
    else {
        ::AfxMessageBox("cant gain address of PrintWindow(..) api\nplease update your sdk");
        Ret = FALSE;
    }
    ::FreeLibrary(handle);
    return (Ret ? TRUE : FALSE);
}