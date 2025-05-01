// Document loaders https://js.langchain.com/docs/integrations/document_loaders/

const DOC_LINKS = {
  intro: "https://raw.githubusercontent.com/esromerog/yq-docs/refs/heads/main/README.md",
  quickStart: "https://raw.githubusercontent.com/esromerog/yq-docs/refs/heads/main/quick-start.md",
};

async function loadDocsFromLink(link: string): Promise<string> {
  const res = await fetch(link);
  if (!res.ok) {
    throw new Error(`Failed to fetch document from ${link}`);
  }
  return await res.text();
}

export const loadDocs = {
  intro: loadDocsFromLink(DOC_LINKS.intro),
  quickStart: loadDocsFromLink(DOC_LINKS.quickStart),
};