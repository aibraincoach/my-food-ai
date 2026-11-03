"use client";
import {useEffect} from "react";
export default function CleanFreshMarker() {
  useEffect(() => {if (new URL(location.href).searchParams.has("_")) history.replaceState(null, "", "/");}, []);
  return null;
}
