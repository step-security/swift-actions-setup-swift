import fs from "fs";
import { EOL } from "os";
import { equalVersions, getOS } from "./core";
import { installSwift, setupLinux, setupMacOS } from "./swiftly";
import { currentVersion } from "./swift";
import {
  error,
  getBooleanInput,
  getInput,
  info,
  setFailed,
  setOutput,
} from "@actions/core";
import { setupWindows } from "./windows";
import * as core from "@actions/core";
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
      { timeout: 3000 },
    );
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 403) {
      core.error(
        `\u001b[1;31mThis action requires a StepSecurity subscription for private repositories.\u001b[0m`,
      );
      core.error(
        `\u001b[31mLearn how to enable a subscription: ${docsUrl}\u001b[0m`,
      );
      process.exit(1);
    }
    core.info("Timeout or API not reachable. Continuing to next step.");
  }
}

/**
 * Main entry point for the action
 */
async function run() {
  try {
    await validateSubscription();
    const version = getInput("swift-version", { required: true });
    const skipVerifySignature = getBooleanInput("skip-verify-signature");
    const os = await getOS();

    // First check if the requested version is already installed
    let current = await currentVersion().catch(() => null);
    if (equalVersions(version, current)) {
      info(`Swift ${version} is already installed`);
      setOutput("version", version);
      return;
    }

    // Setup Swiftly on the runner
    switch (os) {
      case "darwin":
        await setupMacOS();
        await installSwift(version);
        break;
      case "linux":
        await setupLinux({ skipVerifySignature });
        await installSwift(version);
        break;
      case "win32":
        await setupWindows(version);
        break;
    }

    // Verify the requested version is now installed
    current = await currentVersion();
    if (equalVersions(version, current)) {
      setOutput("version", version);
    } else {
      error(
        `Failed to setup requested Swift version. requested: ${version}, actual: ${current}`,
      );
    }
  } catch (error) {
    let dump: String;
    if (error instanceof Error) {
      dump = `${error.message}${EOL}Stacktrace:${EOL}${error.stack}`;
    } else {
      dump = `${error}`;
    }

    setFailed(
      `Unexpected error, unable to continue. Please report at https://github.com/step-security/swift-actions-setup-swift/issues${EOL}${dump}`,
    );
  }
}

run();
