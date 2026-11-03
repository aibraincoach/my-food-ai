"use client";
import {useEffect} from "react";
export default function ShellRefresh() {
  useEffect(() => { const t = setTimeout(() => location.replace("/?_=fresh"), 50); return () => clearTimeout(t); }, []);
  return null;
}
