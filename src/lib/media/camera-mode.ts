"use client";
import { useSyncExternalStore } from "react";
export type CameraMode = "app" | "phone";
const KEY = "mfa-camera-mode";
const listeners = new Set<() => void>();
export function readCameraMode(): CameraMode { try { return localStorage.getItem(KEY) === "phone" ? "phone" : "app"; } catch { return "app"; } }
export function writeCameraMode(mode: CameraMode): void { try { localStorage.setItem(KEY, mode); } catch { /* Keep the default when storage is unavailable. */ } for (const listener of listeners) listener(); }
const subscribe = (listener: () => void) => { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; };
export function useCameraMode(): CameraMode { return useSyncExternalStore(subscribe, readCameraMode, () => "app"); }
