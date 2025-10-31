import { loadPipelineEnv } from "./_env";

async function main(): Promise<void> {
  const env = loadPipelineEnv();

  console.log(
    [
      "[msasl_emit_labels]",
      `data_root=${env.DATA_ROOT}`,
      "TODO: emit unified labels.jsonl using processed clips.",
    ].join(" "),
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error("[msasl_emit_labels] fatal", error);
    process.exit(1);
  });
}
