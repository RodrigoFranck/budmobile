#!/usr/bin/env node
/**
 * Patches expo-modules-autolinking so Gradle uses an absolute Node path
 * (Android Studio does not see nvm/fnm on PATH). See android/settings.gradle
 * System.setProperty("expo.autolinking.nodeBinary", ...).
 */
import { execSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const patches = [
  {
    label: "expo-modules-autolinking",
    pkgName: "expo-modules-autolinking",
    expectedVersion: "3.0.24",
    marker: "android/expo-gradle-plugin/expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/NodeBinary.kt",
    markerType: "fileExists",
    patchFile: "patches/expo-modules-autolinking+3.0.24.patch",
  },
  {
    label: "expo",
    pkgName: "expo",
    expectedVersion: "54.0.32",
    marker: "scripts/autolinking.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/expo+54.0.32.patch",
  },
  {
    label: "expo-modules-core",
    pkgName: "expo-modules-core",
    expectedVersion: "3.0.29",
    marker: "expo-module-gradle-plugin/src/main/kotlin/expo/modules/plugin/ProjectConfiguration.kt",
    markerType: "fileContains",
    markerContains: "androidLibraryExtension().applyPublishingVariant()",
    patchFile: "patches/expo-modules-core+3.0.29.patch",
  },
  {
    label: "expo-constants",
    pkgName: "expo-constants",
    expectedVersion: "18.0.13",
    marker: "scripts/get-app-config-android.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/expo-constants+18.0.13.patch",
  },
  {
    label: "react-native-reanimated",
    pkgName: "react-native-reanimated",
    expectedVersion: "4.1.1",
    marker: "android/build.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/react-native-reanimated+4.1.1.patch",
  },
  {
    label: "react-native-worklets",
    pkgName: "react-native-worklets",
    expectedVersion: "0.5.1",
    marker: "android/build.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/react-native-worklets+0.5.1.patch",
  },
  {
    label: "react-native-screens",
    pkgName: "react-native-screens",
    expectedVersion: "4.16.0",
    marker: "android/build.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/react-native-screens+4.16.0.patch",
  },
  {
    label: "react-native-svg",
    pkgName: "react-native-svg",
    expectedVersion: "15.12.1",
    marker: "android/build.gradle",
    markerType: "fileContains",
    markerContains: "expo.autolinking.nodeBinary",
    patchFile: "patches/react-native-svg+15.12.1.patch",
  },
];

for (const p of patches) {
  const pkgDir = join(projectRoot, "node_modules", p.pkgName);
  const marker = join(pkgDir, p.marker);
  const patchFile = join(projectRoot, p.patchFile);

  if (!existsSync(pkgDir)) {
    continue;
  }

  if (!existsSync(patchFile)) {
    console.warn(`[apply-expo-autolinking-patch] Missing ${p.patchFile}; skip ${p.label}.`);
    continue;
  }

  try {
    const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    if (pkg.version && pkg.version !== p.expectedVersion) {
      console.warn(
        `[apply-expo-autolinking-patch] ${p.pkgName}@${pkg.version} installed; patch targets ${p.expectedVersion}. Skipping.`,
      );
      continue;
    }
  } catch {
    continue;
  }

  // If marker indicates patch already applied, skip.
  if (p.markerType === "fileExists") {
    if (existsSync(marker)) {
      continue;
    }
  } else if (p.markerType === "fileContains") {
    if (existsSync(marker)) {
      try {
        const contents = readFileSync(marker, "utf8");
        if (p.markerContains && contents.includes(p.markerContains)) {
          continue;
        }
      } catch {
        // fall through to patch attempt
      }
    }
  }

  try {
    execSync(`patch -p1 --forward --reject-file=-`, {
      cwd: pkgDir,
      input: readFileSync(patchFile),
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`[apply-expo-autolinking-patch] Applied ${p.patchFile}`);
  } catch (e) {
    console.error(`[apply-expo-autolinking-patch] Failed applying ${p.patchFile}`);
    process.exit(1);
  }
}
