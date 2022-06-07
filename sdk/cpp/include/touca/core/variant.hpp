// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

#pragma once

#include "touca/core/config.hpp"

#ifdef TOUCA_HAS_CPP17
#include <variant>
namespace touca {
namespace detail {
using std::get;
using std::holds_alternative;
using std::monostate;
using std::variant;
using std::visit;
}  // namespace detail
}  // namespace touca
#else
#include "mpark/variant.hpp"
namespace touca {
namespace detail {
using mpark::get;
using mpark::holds_alternative;
using mpark::monostate;
using mpark::variant;
using mpark::visit;
}  // namespace detail
}  // namespace touca
#endif

#include <type_traits>
#include <utility>

#include "touca/lib_api.hpp"

namespace touca {
namespace detail {

/**
 * Combines multiple callable types into one overloaded of them.
 *
 * it's an implementation of famous overloaded but in c++11:
 *  https://www.cppstories.com/2019/02/2lines3featuresoverload.html/
 *
 * it comes very handy and useful if you want to combine lambdas
 * to visit a variant.
 */
template <typename... Fs>
struct overloaded {
  static_assert(sizeof...(Fs) > 0, "must provide at least one callable type.");
};

template <typename F>
struct overloaded<F> : F {
  template <typename Arg>
  constexpr explicit overloaded(Arg&& arg) : F(std::forward<Arg>(arg)) {}

  using F::operator();
};

template <typename F1, typename F2, typename... Rest>
struct overloaded<F1, F2, Rest...> : F1, overloaded<F2, Rest...> {
  template <typename Arg, typename... Args>
  constexpr explicit overloaded(Arg&& arg, Args&&... args)
      : F1(std::forward<Arg>(arg)),
        overloaded<F2, Rest...>(std::forward<Args>(args)...) {}

  using F1::operator();
  using overloaded<F2, Rest...>::operator();
};

/**
 * Makes an `overloaded` by given callables. (it's a helper to deduce types)
 */
template <typename... Fs>
constexpr overloaded<Fs...> make_overloaded(Fs&&... fs) {
  return overloaded<Fs...>{std::forward<Fs>(fs)...};
}

/**
 * Used instead of `auto` when a given type or value is not needed.
 *
 * Implicitly constructible type that doesn't hold any value, useful for sinking
 * an argument.
 */
struct Discarder {
  template <typename... Args>
  constexpr Discarder(Args&&...) noexcept {}

  Discarder& operator=(const Discarder&) = delete;
};

/**
 * A generic templated callable to forward an argument to a given callable.
 *
 * Useful for visiting a variant.
 *
 * @code
 *  visit(make_overloaded(
 *    [](int) { return "numeric"; },
 *    [](const std::string&) { return "string"; },
 *    make_generic_overload([](Discarder) { return "unknown"; })
 *  ), my_variant);
 * @endcode
 */
template <typename F>
struct GenericOverload {
  F _callable;

  constexpr explicit GenericOverload(const F& callable) : _callable(callable) {}

  constexpr explicit GenericOverload(F&& callable)
      : _callable(std::move(callable)) {}

  template <typename Arg>
  constexpr auto operator()(Arg&& arg) const ->
      typename std::result_of<F(Arg)>::type {
    return _callable(std::forward<Arg>(arg));
  }
};

/**
 * Helper function to deduce type of given callable.
 */
template <typename F>
GenericOverload<F> make_generic_overload(F&& callable) {
  return GenericOverload<F>{std::forward<F>(callable)};
}

/**
 * Pointer to heap allocated object, perserving RAII and rule of 5, deep
 * copying on copy.
 */
template <typename T>
class deep_copy_ptr {
 public:
  using value_type = typename std::remove_reference<
      typename std::remove_pointer<T>::type>::type;

  using pointer = typename std::add_pointer<value_type>::type;

  template <typename... Args,
            typename std::enable_if<
                (!std::is_array<T>::value || std::extent<T>::value != 0) &&
                    std::is_constructible<T, Args...>::value,
                bool>::type = true>
  deep_copy_ptr(Args&&... args)
      : _ptr(new value_type(std::forward<Args>(args)...)) {}

  template <typename T2 = T,
            typename std::enable_if<std::is_array<T2>::value &&
                                        std::extent<T2>::value == 0,
                                    bool>::type = true>
  deep_copy_ptr(const std::size_t size)
      : _ptr(new typename std::remove_extent<T>::type[size]) {}

  deep_copy_ptr(const deep_copy_ptr& other) : _ptr(new value_type(*other)) {}

  deep_copy_ptr(deep_copy_ptr&& other) noexcept = default;

  deep_copy_ptr& operator=(const deep_copy_ptr& other) noexcept(
      std::is_nothrow_copy_assignable<value_type>::value) {
    *_ptr = *other._ptr;
    return *this;
  }

  deep_copy_ptr& operator=(deep_copy_ptr&& other) noexcept = default;

  ~deep_copy_ptr() = default;

  void swap(deep_copy_ptr& other) noexcept { std::swap(_ptr, other._ptr); }

  friend bool operator==(const deep_copy_ptr<T>& lhs, const T& rhs) noexcept {
    return *lhs == rhs;
  }

  friend bool operator==(const T& lhs, const deep_copy_ptr<T>& rhs) noexcept {
    return lhs == *rhs;
  }

  friend bool operator==(const deep_copy_ptr<T>& lhs,
                         const deep_copy_ptr<T>& rhs) noexcept {
    return std::addressof(*lhs) == std::addressof(*rhs) || *lhs == *rhs;
  }

  friend bool operator!=(const deep_copy_ptr<T>& lhs, const T& rhs) noexcept {
    return *lhs != rhs;
  }

  friend bool operator!=(const T& lhs, const deep_copy_ptr<T>& rhs) noexcept {
    return lhs != *rhs;
  }

  friend bool operator!=(const deep_copy_ptr<T>& lhs,
                         const deep_copy_ptr<T>& rhs) noexcept {
    return std::addressof(*lhs) != std::addressof(*rhs) || *lhs != *rhs;
  }

  value_type& operator[](const std::size_t index) & noexcept {
    return _ptr[index];
  }

  const value_type& operator[](const std::size_t index) const& noexcept {
    return _ptr[index];
  }

  value_type&& operator[](const std::size_t index) && noexcept {
    return _ptr[index];
  }

  const value_type&& operator[](const std::size_t index) const&& noexcept {
    return _ptr[index];
  }

  value_type& operator*() & noexcept { return *_ptr; }
  const value_type& operator*() const& noexcept { return *_ptr; }
  value_type&& operator*() && noexcept { return *_ptr; }
  const value_type&& operator*() const&& noexcept { return *_ptr; }

  pointer operator->() noexcept { return _ptr.get(); }
  const pointer operator->() const noexcept { return _ptr.get(); }

  operator pointer() const
      noexcept(std::is_nothrow_copy_constructible<value_type>::value) {
    return _ptr.get();
  }

 private:
  std::unique_ptr<value_type> _ptr;
};

}  // namespace detail
}  // namespace touca
