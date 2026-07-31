import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id",
    dataset: process.env.SANITY_STUDIO_DATASET || "your-dataset",
  },
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || "your-studio-hostname",
  deployment: {
    appId: "ny9pxocy0n96lezp2osirmzn",
  },
});
