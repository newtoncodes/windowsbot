#ifndef Capturer_H
#define Capturer_H

struct Bmp {
    BYTE* data;
    int width;
    int height;
    int size;
};

class Capturer {
public:
    Capturer();
    virtual ~Capturer();
    void	SaveBmpToFile(LPTSTR szFileName, int Width, int Height, int Bps, int* lpBits);
    void	Get24BitBmp(const int nWidth, const int nHeight, const HBITMAP &hBitmap, BYTE *lpDesBits);
    Bmp     CaptureDesktop(LPTSTR lpszFileName, BOOL bSaveToFile, int x, int y, int w, int h);
    Bmp     CaptureWindow(HWND hWndSrc, LPTSTR lpszFileName, BOOL bSaveToFile, int x, int y, int w, int h);
    Bmp     Crop(Bmp src, int x, int y, int w, int h);

private:
    BOOL	Capture(HWND hwnd, HDC memDC);

    int		m_Width;
    int		m_Height;
    int		m_Bpp;
};

#endif