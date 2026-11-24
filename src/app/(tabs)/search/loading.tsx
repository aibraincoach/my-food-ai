import {getTranslations} from "next-intl/server";

export default async function Loading() {
 const t=await getTranslations("search");
  return <main><h1 className="sr-only">{t("title")}</h1><p role="status" className="px-screen-x text-detail text-muted">{t("loading")}</p></main>;
}
