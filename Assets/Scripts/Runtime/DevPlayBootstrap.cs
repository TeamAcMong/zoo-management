using UnityEngine;

namespace AWZ.Runtime
{
    /// <summary>
    /// DISABLED — auto-spawn has been moved to <c>AWZ.UI.GameAppBootstrap</c>, which spawns
    /// the UI Toolkit <see cref="GameApp"/> instead of this IMGUI harness.
    ///
    /// This class is kept for reference and for manual instantiation of <see cref="DevHarness"/>
    /// if you need the IMGUI debug overlay without the production UI. To re-enable it, restore
    /// the <c>[RuntimeInitializeOnLoadMethod]</c> attribute on <c>AutoBoot</c> and remove or
    /// rename the attribute in <c>GameAppBootstrap</c>.
    ///
    /// Original purpose: Spawns the <see cref="DevHarness"/> automatically after the first scene
    /// loads so the game was playable by pressing Play in ANY scene without scene wiring.
    /// </summary>
    public static class DevPlayBootstrap
    {
        // AUTO-BOOT DISABLED: AWZ.UI.GameAppBootstrap is now the auto-boot entry point.
        // Restore the attribute below and disable GameAppBootstrap to switch back to IMGUI.
        // [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void AutoBoot()
        {
            // If the production composition root is wired into the scene, defer to it.
            if (Object.FindAnyObjectByType<AppBootstrap>() != null) return;

            // Avoid double-spawning (e.g. additive scene loads).
            if (Object.FindAnyObjectByType<DevHarness>() != null) return;

            var go = new GameObject("AWZ Dev Harness (auto)");
            Object.DontDestroyOnLoad(go);
            go.AddComponent<DevHarness>();

            Debug.Log("[DevPlayBootstrap] No AppBootstrap found — spawned DevHarness so the game is playable. " +
                      "Add an AppBootstrap to a scene to use the production boot path instead.");
        }
    }
}
