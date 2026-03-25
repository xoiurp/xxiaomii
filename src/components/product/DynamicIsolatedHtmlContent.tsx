"use client";

import dynamic from "next/dynamic";

const IsolatedHtmlContent = dynamic(() => import("./IsolatedHtmlContent"), {
  ssr: false,
});

export default IsolatedHtmlContent;