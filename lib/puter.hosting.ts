import puter from "@heyputer/puter.js";
import {
  createHostingSlug,
  fetchBlobFromUrl, getHostedUrl,
  getImageExtension,
  HOSTING_CONFIG_KEY,
  imageUrlToPngBlob,
  isHostedUrl
} from "./utils";

type HostingConfig = { subdomain: string }
type HostedAsset = { url: string }

export const getOrCreateHostingConfig = async (): Promise<HostingConfig | null> => {
  const existing = (await puter.kv.get(HOSTING_CONFIG_KEY)) as HostingConfig | null;
  if (existing?.subdomain) return {
    subdomain: existing.subdomain
  }
  const subdomain = createHostingSlug();

  try {
    const created = await puter.hosting.create(subdomain, '.');
    const config = {subdomain: created.subdomain};
    await puter.kv.set(HOSTING_CONFIG_KEY, config);
    return config;
  } catch (e) {
    console.error(`Failed to create hosting config: ${e}`);
    return null;
  }
}

export const uploadImageToHosting = async ({
                                             hosting,
                                             url,
                                             projectId,
                                             label
                                           }: StoreHostedImageParams): Promise<HostedAsset | null> => {

  if (!hosting || !url) return null;
  if (isHostedUrl(url)) return {url};
  try {
    const renderedPng = label === "rendered" ? await imageUrlToPngBlob(url) : null;
    const resolved = renderedPng ? {blob: renderedPng, contentType: "image/png"} : await fetchBlobFromUrl(url);
    if (!resolved) return null;

    const contentType = resolved.contentType || resolved.blob.type || '';
    const ext = getImageExtension(contentType, url);
    const dir = `projects/${projectId}`;
    const filePath = `${dir}/${label}.${ext}`;

    const uploadFile = new File([resolved.blob], `${label}.${ext}`, {type: contentType});

    await puter.fs.mkdir(dir, {createMissingParents: true});
    await puter.fs.write(filePath, uploadFile);
    const hostedUrl = getHostedUrl({subdomain: hosting.subdomain}, filePath);

    return hostedUrl ? {url: hostedUrl} : null;

  } catch (e) {
    console.warn(`Failed to upload image to hosting: ${e}`);
    return null;
  }

}