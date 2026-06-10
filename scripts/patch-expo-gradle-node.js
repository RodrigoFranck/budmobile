#!/usr/bin/env node
/**
 * Re-applies Node resolver patches for Android Gradle builds.
 * Android Studio does not load nvm/fnm on PATH, so Gradle scripts must read local.properties.
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const nodeModules = path.join(projectRoot, 'node_modules');

const nodeResolverSource = `package expo.modules.plugin

import java.io.File
import java.util.Properties

object NodeResolver {
  fun resolve(androidRoot: File): List<String> {
    val fromEnv = System.getenv("NODE_BINARY")
    if (!fromEnv.isNullOrEmpty()) {
      return listOf(fromEnv)
    }

    val localPropertiesFile = File(androidRoot, "local.properties")
    if (localPropertiesFile.exists()) {
      val properties = Properties()
      localPropertiesFile.inputStream().use { properties.load(it) }
      val fromLocal = properties.getProperty("node.executable")
      if (!fromLocal.isNullOrEmpty()) {
        return listOf(fromLocal)
      }
    }

    val nodeShim = File(androidRoot, "bin/node")
    if (nodeShim.exists()) {
      return listOf("sh", nodeShim.absolutePath)
    }

    val fromNvm = findNodeFromNvm()
    if (fromNvm != null) {
      return listOf(fromNvm)
    }

    val fromFnm = findNodeFromFnm()
    if (fromFnm != null) {
      return listOf(fromFnm)
    }

    return listOf("node")
  }

  private fun findNodeFromNvm(): String? {
    val nvmDir = System.getenv("NVM_DIR") ?: "\${System.getProperty("user.home")}/.nvm"
    val versionsDir = File(nvmDir, "versions/node")
    if (!versionsDir.isDirectory) {
      return null
    }

    return versionsDir.listFiles()
      ?.filter { it.isDirectory }
      ?.sortedByDescending { it.name }
      ?.map { File(it, "bin/node") }
      ?.firstOrNull { it.canExecute() }
      ?.absolutePath
  }

  private fun findNodeFromFnm(): String? {
    val fnmVersionsDir = File("\${System.getProperty("user.home")}/.local/share/fnm/node-versions")
    if (!fnmVersionsDir.isDirectory) {
      return null
    }

    return fnmVersionsDir.listFiles()
      ?.filter { it.isDirectory }
      ?.sortedByDescending { it.name }
      ?.map { File(it, "installation/bin/node") }
      ?.firstOrNull { it.canExecute() }
      ?.absolutePath
  }
}
`;

const nodeCmdExpr =
  '(rootProject.ext.has("nodeCommand") ? rootProject.ext.nodeCommand : ["node"])';

function patchFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    console.warn(`[patch-expo-gradle-node] Skipping missing file: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    if (!content.includes(search)) {
      if (content.includes(replace)) {
        continue;
      }
      throw new Error(`Expected content not found in ${filePath}`);
    }
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content);
}

function writeNodeResolver(targetDir) {
  const targetPath = path.join(targetDir, 'NodeResolver.kt');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(targetPath, nodeResolverSource);
}

const expoAutolinkingGradleRoot = path.join(
  nodeModules,
  'expo-modules-autolinking',
  'android',
  'expo-gradle-plugin'
);

if (fs.existsSync(expoAutolinkingGradleRoot)) {
  writeNodeResolver(
    path.join(
      expoAutolinkingGradleRoot,
      'expo-autolinking-plugin-shared',
      'src',
      'main',
      'kotlin',
      'expo',
      'modules',
      'plugin'
    )
  );

  patchFile(
    path.join(
      expoAutolinkingGradleRoot,
      'expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/AutolinkigCommandBuilder.kt'
    ),
    [
      [
        `class AutolinkingCommandBuilder {
  /**
   * Command for finding and running \`expo-modules-autolinking\`.
   */
  private val baseCommand = listOf(
    "node",
    "--no-warnings",
    "--eval",
    "require('expo/bin/autolinking')",
    "expo-modules-autolinking"
  )`,
        `class AutolinkingCommandBuilder(
  private val androidRoot: File? = null
) {
  /**
   * Command for finding and running \`expo-modules-autolinking\`.
   */
  private val baseCommand: List<String> by lazy {
    NodeResolver.resolve(androidRoot ?: File(".")) + listOf(
      "--no-warnings",
      "--eval",
      "require('expo/bin/autolinking')",
      "expo-modules-autolinking"
    )
  }`,
      ],
    ]
  );

  if (
    !fs
      .readFileSync(
        path.join(
          expoAutolinkingGradleRoot,
          'expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/AutolinkigCommandBuilder.kt'
        ),
        'utf8'
      )
      .includes('import java.io.File')
  ) {
    patchFile(
      path.join(
        expoAutolinkingGradleRoot,
        'expo-autolinking-plugin-shared/src/main/kotlin/expo/modules/plugin/AutolinkigCommandBuilder.kt'
      ),
      [['package expo.modules.plugin\n\n/**', 'package expo.modules.plugin\n\nimport java.io.File\n\n/**']]
    );
  }

  patchFile(
    path.join(
      expoAutolinkingGradleRoot,
      'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsPlugin.kt'
    ),
    [
      [
        `        env.commandLine("node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })")`,
        `        env.commandLine(
          NodeResolver.resolve(settings.rootDir) + listOf(
            "--print",
            "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"
          )
        )`,
      ],
    ]
  );

  patchFile(
    path.join(
      expoAutolinkingGradleRoot,
      'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/ExpoAutolinkingSettingsExtension.kt'
    ),
    [
      [
        `    val commandBuilder = AutolinkingCommandBuilder()
      .command("react-native-config")`,
        `    val commandBuilder = AutolinkingCommandBuilder(settings.rootDir)
      .command("react-native-config")`,
      ],
      [
        `        env.commandLine("node", "--print", "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })")`,
        `        env.commandLine(
          NodeResolver.resolve(settings.rootDir) + listOf(
            "--print",
            "require.resolve('@react-native/gradle-plugin/package.json', { paths: [require.resolve('react-native/package.json')] })"
          )
        )`,
      ],
      [
        `        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")`,
        `        env.commandLine(
          NodeResolver.resolve(settings.rootDir) + listOf(
            "--print",
            "require.resolve('react-native/package.json')"
          )
        )`,
      ],
    ]
  );

  patchFile(
    path.join(
      expoAutolinkingGradleRoot,
      'expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt'
    ),
    [
      [
        `    val command = AutolinkingCommandBuilder()
      .command("resolve")`,
        `    val command = AutolinkingCommandBuilder(settings.rootDir)
      .command("resolve")`,
      ],
    ]
  );
}

const expoModuleGradlePluginDir = path.join(
  nodeModules,
  'expo-modules-core',
  'expo-module-gradle-plugin',
  'src',
  'main',
  'kotlin',
  'expo',
  'modules',
  'plugin'
);

if (fs.existsSync(expoModuleGradlePluginDir)) {
  writeNodeResolver(expoModuleGradlePluginDir);

  const helperPath = path.join(
    expoModuleGradlePluginDir,
    'gradle',
    'ExpoGradleHelperExtension.kt'
  );

  patchFile(helperPath, [
    [
      'package expo.modules.plugin.gradle\n\nimport expo.modules.plugin.Version',
      'package expo.modules.plugin.gradle\n\nimport expo.modules.plugin.NodeResolver\nimport expo.modules.plugin.Version',
    ],
    [
      `        env.commandLine("node", "--print", "require.resolve('react-native/package.json')")`,
      `        env.commandLine(
          NodeResolver.resolve(project.rootProject.projectDir) + listOf(
            "--print",
            "require.resolve('react-native/package.json')"
          )
        )`,
    ],
  ]);
}

patchFile(path.join(nodeModules, 'expo/scripts/autolinking.gradle'), [
  [
    `def autolinkingPath = ["node", "--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"]`,
    `def nodeCmd = rootProject.ext.has("nodeCommand") ? rootProject.ext.nodeCommand : ["node"]
def autolinkingPath = nodeCmd + ["--print", "require.resolve('expo-modules-autolinking/package.json', { paths: [require.resolve('expo/package.json')] })"]`,
  ],
]);

patchFile(path.join(nodeModules, 'expo-constants/scripts/get-app-config-android.gradle'), [
  [
    `def expoConstantsDir = project.providers.exec {
  workingDir(projectDir)
  commandLine("node", "-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));")
}.standardOutput.asText.get().trim()

def config = project.hasProperty("react") ? project.react : [];
def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: ["node"]`,
    `def nodeCmd = rootProject.ext.has("nodeCommand") ? rootProject.ext.nodeCommand : ["node"]

def expoConstantsDir = project.providers.exec {
  workingDir(projectDir)
  commandLine(nodeCmd + ["-e", "console.log(require('path').dirname(require.resolve('expo-constants/package.json')));"])
}.standardOutput.asText.get().trim()

def config = project.hasProperty("react") ? project.react : [];
def nodeExecutableAndArgs = config.nodeExecutableAndArgs ?: nodeCmd`,
  ],
]);

const nodeCommandReplacements = [
  [
    'commandLine("node", "--print", "require.resolve(\'react-native/package.json\')")',
    `commandLine(${nodeCmdExpr} + ["--print", "require.resolve('react-native/package.json')"])`,
  ],
  [
    'commandLine("node", "--print", "require.resolve(\'react-native-worklets/package.json\')")',
    `commandLine(${nodeCmdExpr} + ["--print", "require.resolve('react-native-worklets/package.json')"])`,
  ],
  [
    'commandLine("node", "./../scripts/validate-react-native-version.js", REACT_NATIVE_VERSION.toString())',
    `commandLine(${nodeCmdExpr} + ["./../scripts/validate-react-native-version.js", REACT_NATIVE_VERSION.toString()])`,
  ],
  [
    'commandLine("node", "./../scripts/validate-worklets-build.js")',
    `commandLine(${nodeCmdExpr} + ["./../scripts/validate-worklets-build.js"])`,
  ],
];

for (const pkg of [
  'react-native-reanimated',
  'react-native-screens',
  'react-native-svg',
  'react-native-worklets',
]) {
  const buildGradle = path.join(nodeModules, pkg, 'android/build.gradle');
  for (const replacement of nodeCommandReplacements) {
    try {
      patchFile(buildGradle, [replacement]);
    } catch (error) {
      if (!error.message.includes('Expected content not found')) {
        throw error;
      }
    }
  }
}

console.log('[patch-expo-gradle-node] Android Gradle Node resolver patches applied');
