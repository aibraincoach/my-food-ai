#!/usr/bin/env node
/**
 * Memory and load guard for anything that opens browser tabs or spawns heavy processes (npx, builds, runners).
 * Refuses with exit code 7 and prints the numbers; it never silently reduces the work.
 * Module:  import { assertMemory } from "./mem-guard.mjs"; assertMemory({ tabs: 5 });
 * Command: node tools/mem-guard.mjs [tabs]
 * Env: PPLX_FLOOR_MB (default 2048), PPLX_PER_TAB_MB (default 350), PPLX_MAX_LOAD (default 3 x cores).
 */
import { readFileSync } from "node:fs";
import { cpus } from "node:os";

export function readMemAvailableMb() {
  const text = readFileSync("/proc/meminfo", "utf8");
  const m = text.match(/^MemAvailable:\s+(\d+)\s+kB/m);
  if (!m) throw new Error("MemAvailable not found in /proc/meminfo");
  return Math.floor(Number(m[1]) / 1024);
}

export function readLoad1() {
  return Number(readFileSync("/proc/loadavg", "utf8").split(" ")[0]);
}

export function assertMemory({ tabs = 1 } = {}) {
  const floorMb = Number(process.env.PPLX_FLOOR_MB || 2048);
  const perTabMb = Number(process.env.PPLX_PER_TAB_MB || 350);
  const maxLoad = Number(process.env.PPLX_MAX_LOAD || 3 * cpus().length);
  const needMb = floorMb + tabs * perTabMb;
  const haveMb = readMemAvailableMb();
  const load = readLoad1();
  const line = `mem-guard: need ${needMb} MB (floor ${floorMb} + ${tabs} x ${perTabMb}), available ${haveMb} MB, load1 ${load}, max load ${maxLoad}`;
  if (haveMb < needMb || load > maxLoad) {
    const err = new Error(`REFUSED ${line}`);
    err.exitCode = 7;
    throw err;
  }
  console.error(`ok ${line}`);
  return { needMb, haveMb, load };
}

if (process.argv[1] && process.argv[1].endsWith("mem-guard.mjs")) {
  try {
    assertMemory({ tabs: Number.parseInt(process.argv[2] || "1", 10) });
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(e.exitCode ?? 2);
  }
}
