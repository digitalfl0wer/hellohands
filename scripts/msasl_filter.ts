import { loadPipelineEnv } from "./_env";

async function main(): Promise<void> {
  const env = loadPipelineEnv();

  console.log(
    [
      "[msasl_filter]",
      `subset=${env.SUBSET ?? "default"}`,
      "TODO: implement filtering logic that trims MS-ASL metadata.",
    ].join(" "),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[msasl_filter] fatal", error);
    process.exit(1);
  });
}
