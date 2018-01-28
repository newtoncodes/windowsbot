#ifndef __Vec2__
#define __Vec2__

#include <string>
#include <list>
#include <vector>
#include <map>
#include <set>
#include <queue>
#include <stack>
#include <algorithm>
#include <cassert>
#include <sstream>
#include <stdexcept>
#include <ostream>
#include <fstream>
#include <math.h>
#include <windows.h>

using namespace std;

typedef signed char int8;
typedef signed short int16;
typedef signed int int32;
typedef signed long long int64;
typedef unsigned char uint8;
typedef unsigned short uint16;
typedef unsigned int uint32;
typedef unsigned long long uint64;
typedef float float32;
typedef double float64;

struct Vec2 {
    /// Default constructor does nothing (for performance).
    Vec2() {}

    /// Construct using coordinates.
    Vec2(float32 x, float32 y) : x(x), y(y) {}

    /// Set this vector to all zeros.
    void SetZero() { x = 0.0f; y = 0.0f; }

    /// Set this vector to some specified coordinates.
    void Set(float32 x_, float32 y_) { x = x_; y = y_; }

    /// Negate this vector.
    Vec2 operator -() const { Vec2 v; v.Set(-x, -y); return v; }

    /// Read from and indexed element.
    float32 operator () (int32 i) const {
        return (&x)[i];
    }

    /// Write to an indexed element.
    float32& operator () (int32 i) {
        return (&x)[i];
    }

    /// Add a vector to this vector.
    void operator += (const Vec2& v) {
        x += v.x; y += v.y;
    }

    /// Subtract a vector from this vector.
    void operator -= (const Vec2& v) {
        x -= v.x; y -= v.y;
    }

    /// Multiply this vector by a scalar.
    void operator *= (float32 a) {
        x *= a; y *= a;
    }

    /// Subtract a vector from this vector.
    Vec2 operator -(const Vec2 & v) const {
        Vec2 v1;
        v1.Set(x - v.x, y - v.y);
        return v1;
    }

    /// Subtract a vector from this vector.
    Vec2 operator +(const Vec2 & v) const {
        Vec2 v1;
        v1.Set(x + v.x, y + v.y);
        return v1;
    }

    /// Multiply this vector by a scalar.
    Vec2 operator * (double a) const {
        Vec2 v;
        v.Set(x * a, y * a);
        return v;
    }

    /// Multiply this vector by a scalar.
    Vec2 operator / (double a) const {
        Vec2 v;
        v.Set(x / a, y / a);
        return v;
    }

    void Resize(double sz) {
        double l = Length();
        double r = sz / l;
        x *= r;
        y *= r;
    }

    /// Get the length of this vector (the norm).
    float32 Length() const {
        return std::sqrt(x * x + y * y);
    }

    // Calculate the dot product between this vec2 and
    // another one.
    float32 Dot(const Vec2& other) const {
        return x*other.y + y*other.x;
    }

    inline static Vec2 FromPolar(float32 radius, float32 angleRads) {
        return Vec2(radius*cos(angleRads), radius*sin(angleRads));
    }

    /// Get the skew vector such that dot(skew_vec, other) == cross(vec, other)
    Vec2 Skew() const {
        return Vec2(-y, x);
    }

    inline friend std::ostream& operator<<(std::ostream& out, const Vec2& s) {
        out << "(" << s.x << "," << s.y << ")";
        return out;
    }

    float32 x, y;
};

#endif