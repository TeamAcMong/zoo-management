#if UNITY_EDITOR
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace AWZ.EditorTools
{
    /// <summary>
    /// One-click / one-command WebGL build for browser ("HTML") testing.
    ///
    /// Menu:  AWZ ▸ Build ▸ WebGL
    /// CLI :  "&lt;UnityPath&gt;\Unity.exe" -batchmode -quit -projectPath "&lt;proj&gt;"
    ///        -executeMethod AWZ.EditorTools.AwzBuild.BuildWebGL -logFile -
    ///
    /// Requires the "WebGL Build Support" module to be installed for this editor version
    /// (Unity Hub ▸ Installs ▸ 6000.3.17f1 ▸ Add Modules ▸ WebGL Build Support).
    /// Output: Builds/WebGL/ (open index.html through a local HTTP server — not file://).
    /// </summary>
    public static class AwzBuild
    {
        private const string OutDir = "Builds/WebGL";

        [MenuItem("AWZ/Build/WebGL")]
        public static void BuildWebGL()
        {
            string[] scenes = GetScenes();
            if (scenes.Length == 0)
            {
                Debug.LogError("[AwzBuild] No scene found to build. Add one to Build Settings " +
                               "or keep a .unity scene under Assets/.");
                return;
            }

            var opts = new BuildPlayerOptions
            {
                scenes           = scenes,
                locationPathName = OutDir,
                target           = BuildTarget.WebGL,
                targetGroup      = BuildTargetGroup.WebGL,
                options          = BuildOptions.None,
            };

            Debug.Log($"[AwzBuild] Building WebGL → {OutDir}  (scenes: {string.Join(", ", scenes)})");
            BuildReport report = BuildPipeline.BuildPlayer(opts);
            BuildSummary s = report.summary;

            if (s.result == BuildResult.Succeeded)
                Debug.Log($"[AwzBuild] WebGL build SUCCEEDED → {OutDir} " +
                          $"({s.totalSize / (1024 * 1024)} MB). Serve it over HTTP and open index.html.");
            else
                Debug.LogError($"[AwzBuild] WebGL build {s.result} — {s.totalErrors} error(s).");
        }

        /// <summary>Enabled Build-Settings scenes, else the first scene found under Assets/.</summary>
        private static string[] GetScenes()
        {
            var enabled = EditorBuildSettings.scenes
                .Where(sc => sc.enabled)
                .Select(sc => sc.path)
                .ToArray();
            if (enabled.Length > 0) return enabled;

            return AssetDatabase.FindAssets("t:Scene", new[] { "Assets" })
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(p => p.StartsWith("Assets/"))
                .Take(1)
                .ToArray();
        }
    }
}
#endif
