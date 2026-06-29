[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

# Setup Swift using Swiftly

<p>
  <a href="https://github.com/features/actions">
    <img src="https://img.shields.io/badge/GitHub-Action-blue?logo=github" alt="GitHub Action" />
  </a>
  <a href="https://help.github.com/en/actions/automating-your-workflow-with-github-actions/virtual-environments-for-github-hosted-runners#supported-runners-and-hardware-resources">
    <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Ubuntu%20%7C%20Windows-lightgray" alt="Supports macOS, Ubuntu & Windows" />
  </a>
  <a href="https://swift.org">
    <img src="https://img.shields.io/badge/Swift-6.2-F05138?logo=swift&logoColor=white" alt="Swift 6.2" />
  </a>
  <a href="https://github.com/step-security/swift-actions-setup-swift/releases/latest">
    <img src="https://img.shields.io/github/v/release/step-security/swift-actions-setup-swift?sort=semver" alt="Latest release" />
  </a>
</p>

[GitHub Action](https://github.com/features/actions) that will setup a [Swift](https://swift.org) environment with a specific version using [Swiftly](https://www.swift.org/swiftly/documentation/swiftlydocs/). Works on both Ubuntu and macOS runners.

> [!IMPORTANT]
> Version 3 is currently in beta. Please report any issues you encounter. To use legacy version 2, use `@v2`.

## Usage

To run the action with the latest swift version available, simply add the action as a step in your workflow:

```yaml
- uses: step-security/swift-actions-setup-swift@v2
```

After the environment is configured you can run swift commands using the standard [`run`](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/workflow-syntax-for-github-actions#jobsjob_idstepsrun) step:

```yaml
- uses: step-security/swift-actions-setup-swift@v2
- name: Get swift version
  run: swift --version # Swift 6.2
```

A specific Swift version can be set using the `swift-version` input:

```yaml
- uses: step-security/swift-actions-setup-swift@v2
  with:
    swift-version: "5.1"
- name: Get swift version
  run: swift --version # Swift 5.1.0
```

Also works with snapshots:

```yaml
- uses: step-security/swift-actions-setup-swift@v2
  with:
    swift-version: "main-snapshot"
```

Works perfect together with matrixes:

```yaml
name: Swift ${{ matrix.swift }} on ${{ matrix.os }}
runs-on: ${{ matrix.os }}
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    swift: ["5.4.3", "5.2.4"]
steps:
  - uses: step-security/swift-actions-setup-swift@v2
    with:
      swift-version: ${{ matrix.swift }}
  - name: Get swift version
    run: swift --version
```

### Skip GPG signature verification

If you are running on a runner that is not able to verify the GPG signature of the Swiftly package, you can skip the verification by setting the `skip-verify-signature` input to `true`.

```yaml
- uses: step-security/swift-actions-setup-swift@v2
  with:
    skip-verify-signature: true
```

### Caveats

YAML interprets eg. `5.0` as a float, this action will then interpret that as `5` which will result in eg. Swift 5.5 being resolved. Quote your inputs! Thus:

```
- uses: step-security/swift-actions-setup-swift@v2
  with:
    swift-version: '5.0'
```

Not:

```
- uses: step-security/swift-actions-setup-swift@v2
  with:
    swift-version: 5.0
```

## Legal

Uses MIT license.
The Swift logo is a trademark of Apple Inc.
