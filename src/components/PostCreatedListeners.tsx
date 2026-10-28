"use client";

import { useEffect } from "react";

// The shell owns this slot for the installed-app notification prompt in item 24.
export default function PostCreatedListeners() {
  useEffect(() => {
    const onPostCreated = () => {};
    window.addEventListener("post-created", onPostCreated);
    return () => window.removeEventListener("post-created", onPostCreated);
  }, []);
  return null;
}
