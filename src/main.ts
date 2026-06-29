import fs from "fs";
import { EOL } from "os";
import * as core from "@actions/core";
import * as system from "./os";
import * as versions from "./swift-versions";
import * as macos from "./macos-install";
import * as linux from "./linux-install";
import * as windows from "./windows-install";
import { getVersion } from "./get-version";
import axios, { isAxiosError } from "axios";

async function validateSubscription() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  let repoPrivate: boolean | undefined;

  if (eventPath && fs.existsSync(eventPath)) {
    const eventData = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    repoPrivate = eventData?.repository?.private;
  }

  const upstream = "swift-actions/setup-swift";
  const action = process.env.GITHUB_ACTION_REPOSITORY;
  const docsUrl =
    "https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions";

  core.info("");
  core.info("\u001b[1;36mStepSecurity Maintained Action\u001b[0m");
  core.info(`Secure drop-in replacement for ${upstream}`);
  if (repoPrivate === false)
    core.info("\u001b[32m\u2713 Free for public repositories\u001b[0m");
  core.info(`\u001b[36mLearn more:\u001b[0m ${docsUrl}`);
  core.info("");

  if (repoPrivate === false) return;

  const serverUrl = process.env.GITHUB_SERVER_URL || "https://github.com";
  const body: Record<string, string> = { action: action || "" };
  if (serverUrl !== "https://github.com") body.ghes_server = serverUrl;
  try {
    await axios.post(
      `https://agent.api.stepsecurity.io/v1/github/${process.env.GITHUB_REPOSITORY}/actions/maintained-actions-subscription`,
      body,
      { timeout: 3000 }
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`
      );
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`
      );
      process.exit(1);
    }
    core.info("Timeout or API not reachable. Continuing to next step.");
  }
}

async function run() {
  try {
    await validateSubscription();
    const requestedVersion = core.getInput("swift-version", { required: true });

    let platform = await system.getSystem();
    let version = versions.verify(requestedVersion, platform);

    switch (platform.os) {
      case system.OS.MacOS:
        await macos.install(version, platform);
        break;
      case system.OS.Ubuntu:
        await linux.install(version, platform);
        break;
      case system.OS.Windows:
        await windows.install(version, platform);
    }

    const current = await getVersion();
    if (current === version) {
      core.setOutput("version", version);
    } else {
      core.error(
        `Failed to setup requested swift version. requestd: ${version}, actual: ${current}`
      );
    }
  } catch (error) {
    let dump: String;
    if (error instanceof Error) {
      dump = `${error.message}${EOL}Stacktrace:${EOL}${error.stack}`;
    } else {
      dump = `${error}`;
    }

    core.setFailed(
      `Unexpected error, unable to continue. Please report at https://github.com/step-security/swift-actions-setup-swift/issues${EOL}${dump}`
    );
  }
}

run();
