/**
 * Shared Result utility for unified success/error handling across systems.
 * Lightweight and framework-agnostic.
 */
export interface Ok<T> { ok: true; value: T }
export interface Err<E> { ok: false; error: E }
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> { return { ok: true, value }; }
export function err<E>(error: E): Err<E> { return { ok: false, error }; }

export function map<T, E, U>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r;
}

export function mapError<T, E, F>(r: Result<T, E>, fn: (e: E) => F): Result<T, F> {
  return r.ok ? r : err(fn(r.error));
}

/** Combine an array of Result into Result of array (fail-fast). */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const acc: T[] = [];
  for (const r of results) {
    if (!r.ok) return r;
    acc.push(r.value);
  }
  return ok(acc);
}
