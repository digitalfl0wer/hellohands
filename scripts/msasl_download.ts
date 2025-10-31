import { loadPipelineEnv } from "./_env";

async function main(): Promise<void> {
  const env = loadPipelineEnv();

  console.log(
    [
      "[msasl_download]",
      `retries=${env.DOWNLOAD_RETRIES}`,
      "TODO: implement downloader that fetches MS-ASL videos.",
    ].join(" "),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[msasl_download] fatal", error);
    process.exit(1);
  });
}
